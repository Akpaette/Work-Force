import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStaffSchema, insertDepartmentSchema, insertAccessLogSchema, loginSchema, USER_ROLES } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

// Authentication middleware
interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
}

async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("No token provided in request");
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    console.log("Validating token:", token.substring(0, 8) + "...");
    
    const session = await storage.getSessionByToken(token);
    if (!session) {
      console.log("Session not found for token");
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      console.log("Session has expired:", session.expiresAt);
      await storage.deleteSession(token);
      return res.status(401).json({ message: "Session expired" });
    }

    const user = await storage.getUser(session.userId);
    if (!user || !user.isActive) {
      console.log("User not found or inactive:", user?.id);
      return res.status(401).json({ message: "User account is inactive" });
    }

    console.log("Authentication successful for user:", user.username);
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Authorization middleware
function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

// Permission check middleware
function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!storage.hasPermission(req.user.role, permission as any)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUser(validatedData.username, validatedData.password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

      const session = await storage.createSession({
        userId: user.id,
        sessionToken,
        expiresAt,
      });

      // Log successful login
      await storage.createAccessLog({
        userId: user.id,
        action: "LOGIN_SUCCESS",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        token: sessionToken,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        await storage.deleteSession(token);
      }

      // Log logout
      await storage.createAccessLog({
        userId: req.user?.id,
        action: "LOGOUT",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/user", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      res.json({
        id: user?.id,
        username: user?.username,
        role: user?.role,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
      });
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });



  // Generate QR code for staff verification
  app.post("/api/staff/:id/qr-code", async (req: AuthRequest, res) => {
    try {
      const staffId = parseInt(req.params.id);
      const staff = await storage.getStaff(staffId);
      
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      // Create profile URL for QR code - links directly to staff profile
      const profileUrl = `${req.protocol}://${req.get('host')}/staff-profile/${staff.id}`;
      
      // Create verification data for QR code
      const verificationData = {
        staffId: staff.id,
        registrationNumber: staff.registrationNumber,
        fullName: `${staff.firstName} ${staff.lastName}`,
        department: staff.department,
        position: staff.position,
        profileUrl: profileUrl,
        verificationUrl: `${req.protocol}://${req.get('host')}/verify/${staff.id}`,
        timestamp: new Date().toISOString()
      };

      const QRCode = await import('qrcode');
      // Generate QR code that links directly to the staff profile
      const qrCodeDataURL = await QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({ 
        qrCodeUrl: qrCodeDataURL,
        verificationData
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Verify staff QR code
  app.get("/api/verify/:id", async (req, res) => {
    try {
      const staffId = parseInt(req.params.id);
      const staff = await storage.getStaff(staffId);
      
      if (!staff) {
        return res.status(404).json({ 
          message: "Staff member not found",
          valid: false 
        });
      }

      res.json({
        valid: true,
        staff: {
          id: staff.id,
          registrationNumber: staff.registrationNumber,
          fullName: `${staff.firstName} ${staff.lastName}`,
          department: staff.department,
          position: staff.position,
          status: staff.status,
          profilePhoto: staff.profilePhoto,
          dateOfJoining: staff.dateOfJoining
        },
        verifiedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error verifying staff:", error);
      res.status(500).json({ 
        message: "Verification failed",
        valid: false 
      });
    }
  });

  // Staff routes
  app.get("/api/staff", async (req, res) => {
    try {
      const { department, search } = req.query;
      
      let staff;
      if (search && typeof search === 'string') {
        staff = await storage.searchStaff(search);
      } else if (department && typeof department === 'string') {
        staff = await storage.getStaffByDepartment(department);
      } else {
        staff = await storage.getAllStaff();
      }
      
      res.json(staff);
    } catch (error) {
      console.error("Staff fetch error:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staff = await storage.getStaff(id);
      
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff member" });
    }
  });

  app.post("/api/staff", authenticateToken, requirePermission("canCreateStaff"), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertStaffSchema.parse(req.body);
      
      // Check if registration number already exists
      const existingStaff = await storage.getStaffByRegistrationNumber(validatedData.registrationNumber);
      if (existingStaff) {
        return res.status(400).json({ message: "Registration number already exists" });
      }
      
      const newStaff = await storage.createStaff(validatedData);
      
      // Log staff creation
      await storage.createAccessLog({
        userId: req.user?.id,
        staffId: newStaff.id,
        action: "STAFF_CREATED",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(201).json(newStaff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  app.put("/api/staff/:id", authenticateToken, requirePermission("canEditStaff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStaffSchema.partial().parse(req.body);
      
      const updatedStaff = await storage.updateStaff(id, validatedData);
      
      if (!updatedStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      // Log staff update
      await storage.createAccessLog({
        userId: req.user?.id,
        staffId: id,
        action: "STAFF_UPDATED",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(updatedStaff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.delete("/api/staff/:id", authenticateToken, requirePermission("canDeleteStaff"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid staff ID" });
      }
      
      console.log(`Attempting to delete staff member with ID: ${id}`);
      
      const deleted = await storage.deleteStaff(id);
      
      if (!deleted) {
        console.log(`Staff member with ID ${id} not found`);
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      console.log(`Successfully deleted staff member with ID: ${id}`);
      
      // Log staff deletion
      try {
        await storage.createAccessLog({
          userId: req.user?.id,
          staffId: id,
          action: "STAFF_DELETED",
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      } catch (logError) {
        console.error("Failed to log deletion:", logError);
        // Don't fail the deletion if logging fails
      }
      
      res.json({ message: "Staff member deleted successfully" });
    } catch (error) {
      console.error("Error deleting staff member:", error);
      res.status(500).json({ 
        message: "Failed to delete staff member",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // PIN verification route
  app.post("/api/staff/:id/verify-pin", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { pin } = req.body;
      
      if (!pin) {
        return res.status(400).json({ message: "PIN is required" });
      }
      
      const isValid = await storage.verifyStaffPin(id, pin);
      
      if (!isValid) {
        // Log failed access attempt
        await storage.createAccessLog({
          staffId: id,
          userId: 1, // Default admin user
          action: "PIN_VERIFICATION_FAILED",
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
        
        return res.status(401).json({ message: "Invalid PIN" });
      }
      
      // Log successful access
      await storage.createAccessLog({
        staffId: id,
        userId: 1, // Default admin user
        action: "PIN_VERIFICATION_SUCCESS",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      const staff = await storage.getStaff(id);
      res.json({ message: "PIN verified", staff });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify PIN" });
    }
  });

  // Department routes
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      
      // Check if department already exists
      const existingDepartment = await storage.getDepartmentByName(validatedData.name);
      if (existingDepartment) {
        return res.status(400).json({ message: "Department already exists" });
      }
      
      const newDepartment = await storage.createDepartment(validatedData);
      res.status(201).json(newDepartment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  // Statistics route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStaffStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Access logs route
  app.get("/api/access-logs", async (req, res) => {
    try {
      const { staffId, limit } = req.query;
      
      let logs;
      if (staffId) {
        logs = await storage.getAccessLogsByStaff(parseInt(staffId as string));
      } else {
        logs = await storage.getRecentAccessLogs(limit ? parseInt(limit as string) : undefined);
      }
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
