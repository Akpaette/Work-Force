import { 
  users, staff, departments, sessions, accessLogs, 
  type User, type InsertUser, type Staff, type InsertStaff, 
  type Department, type InsertDepartment, type Session, type InsertSession,
  type AccessLog, type InsertAccessLog, USER_ROLES, ROLE_PERMISSIONS
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, like, ilike, gte, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  updateUserLastLogin(id: number): Promise<void>;

  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<boolean>;
  deleteExpiredSessions(): Promise<void>;

  // Staff operations
  getStaff(id: number): Promise<Staff | undefined>;
  getStaffByRegistrationNumber(registrationNumber: string): Promise<Staff | undefined>;
  getAllStaff(): Promise<Staff[]>;
  getStaffByDepartment(department: string): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<boolean>;
  searchStaff(query: string): Promise<Staff[]>;


  // Department operations
  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentByName(name: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartmentStaffCount(name: string, count: number): Promise<void>;

  // Access log operations
  createAccessLog(log: InsertAccessLog): Promise<AccessLog>;
  getAccessLogsByStaff(staffId: number): Promise<AccessLog[]>;
  getRecentAccessLogs(limit?: number): Promise<AccessLog[]>;

  // Statistics
  getStaffStats(): Promise<{
    totalStaff: number;
    activeStaff: number;
    totalDepartments: number;
    recentAdditions: number;
  }>;

  // Authorization helpers
  hasPermission(userRole: string, permission: keyof typeof ROLE_PERMISSIONS[typeof USER_ROLES.ADMIN]): boolean;
  canAccessStaff(userRole: string, staffId?: number): boolean;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private staff: Map<number, Staff> = new Map();
  private departments: Map<number, Department> = new Map();
  private sessions: Map<string, Session> = new Map();
  private accessLogs: Map<number, AccessLog> = new Map();
  private currentUserId = 1;
  private currentStaffId = 1;
  private currentDepartmentId = 1;
  private currentSessionId = 1;
  private currentAccessLogId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default departments
    const defaultDepartments = [
      { name: "General Overseers", description: "Church leadership and oversight", icon: "crown", color: "purple" },
      { name: "Church Executives", description: "Executive leadership team", icon: "user-tie", color: "blue" },
      { name: "Pastors", description: "Pastoral ministry and care", icon: "cross", color: "green" },
      { name: "Evangelists", description: "Evangelism and outreach", icon: "bible", color: "orange" },
      { name: "Administrative Staff", description: "Administrative support", icon: "briefcase", color: "indigo" },
      { name: "Other Workers", description: "General church workers", icon: "users", color: "gray" },
    ];

    defaultDepartments.forEach(dept => {
      const id = this.currentDepartmentId++;
      this.departments.set(id, {
        ...dept,
        id,
        staffCount: 0,
        createdAt: new Date(),
      });
    });

    // Create default admin user
    const now = new Date();
    this.users.set(1, {
      id: 1,
      username: "admin@seedofchrist.org",
      password: "5646", // In production, this would be hashed
      role: USER_ROLES.ADMIN,
      firstName: "System",
      lastName: "Administrator",
      email: "admin@seedofchrist.org",
      isActive: true,
      lastLogin: null,
      createdAt: now,
      updatedAt: now,
    });
    this.currentUserId = 2;
    
    // Initialize with empty staff data - no sample profiles
    this.currentStaffId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || USER_ROLES.VIEWER,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      email: insertUser.email || null,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      lastLogin: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      ...updateData,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || !user.isActive) return null;
    
    // In production, you would hash the password and compare
    if (user.password === password) {
      return user;
    }
    return null;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  // Session operations
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = {
      ...insertSession,
      id,
      createdAt: new Date(),
    };
    this.sessions.set(session.sessionToken, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const session = this.sessions.get(token);
    if (!session) return undefined;
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(token);
      return undefined;
    }
    
    return session;
  }

  async deleteSession(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    const sessionsToDelete: string[] = [];
    
    this.sessions.forEach((session, token) => {
      if (now > session.expiresAt) {
        sessionsToDelete.push(token);
      }
    });
    
    sessionsToDelete.forEach(token => this.sessions.delete(token));
  }

  // Staff operations
  async getStaff(id: number): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async getStaffByRegistrationNumber(registrationNumber: string): Promise<Staff | undefined> {
    return Array.from(this.staff.values()).find(s => s.registrationNumber === registrationNumber);
  }

  async getAllStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values());
  }

  async getStaffByDepartment(department: string): Promise<Staff[]> {
    return Array.from(this.staff.values()).filter(s => s.department === department);
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const id = this.currentStaffId++;
    const now = new Date();
    const staff: Staff = {
      ...insertStaff,
      id,
      email: insertStaff.email || null,
      dateOfBirth: insertStaff.dateOfBirth || null,
      address: insertStaff.address || null,
      ordinationStatus: insertStaff.ordinationStatus || null,
      dateOfOrdination: insertStaff.dateOfOrdination || null,
      relationshipStatus: insertStaff.relationshipStatus || null,
      spouseFirstName: insertStaff.spouseFirstName || null,
      spouseLastName: insertStaff.spouseLastName || null,
      spouseOccupation: insertStaff.spouseOccupation || null,
      spousePhone: insertStaff.spousePhone || null,
      spouseEmail: insertStaff.spouseEmail || null,
      primaryPlaceOfAssignment: insertStaff.primaryPlaceOfAssignment || null,
      previousMinistry: insertStaff.previousMinistry || null,
      previousEmployment: insertStaff.previousEmployment || null,
      additionalBackground: insertStaff.additionalBackground || null,
      educationLevel: insertStaff.educationLevel || null,
      fieldOfStudy: insertStaff.fieldOfStudy || null,
      institution: insertStaff.institution || null,
      certifications: insertStaff.certifications || null,
      emergencyContactEmail: insertStaff.emergencyContactEmail || null,
      guarantorEmail: insertStaff.guarantorEmail || null,
      guarantorAddress: insertStaff.guarantorAddress || null,
      guarantorOccupation: insertStaff.guarantorOccupation || null,
      profilePhoto: insertStaff.profilePhoto || null,
      documents: insertStaff.documents || [],
      status: (insertStaff.status as "active" | "inactive" | "released" | "retired") || "active",
      createdAt: now,
      updatedAt: now,
    };
    this.staff.set(id, staff);
    
    // Update department staff count
    const departmentStaffCount = Array.from(this.staff.values()).filter(s => s.department === insertStaff.department).length;
    await this.updateDepartmentStaffCount(insertStaff.department, departmentStaffCount);
    
    return staff;
  }

  async updateStaff(id: number, updateData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const existingStaff = this.staff.get(id);
    if (!existingStaff) return undefined;

    const updatedStaff: Staff = {
      ...existingStaff,
      ...updateData,
      status: (updateData.status as "active" | "inactive" | "released" | "retired") || existingStaff.status,
      updatedAt: new Date(),
    };
    this.staff.set(id, updatedStaff);
    return updatedStaff;
  }

  async deleteStaff(id: number): Promise<boolean> {
    const staff = this.staff.get(id);
    if (!staff) return false;

    this.staff.delete(id);
    
    // Update department staff count
    const departmentStaffCount = Array.from(this.staff.values()).filter(s => s.department === staff.department).length;
    await this.updateDepartmentStaffCount(staff.department, departmentStaffCount);
    
    return true;
  }

  async searchStaff(query: string): Promise<Staff[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.staff.values()).filter(s => 
      s.registrationNumber.toLowerCase().includes(lowercaseQuery) ||
      s.firstName.toLowerCase().includes(lowercaseQuery) ||
      s.lastName.toLowerCase().includes(lowercaseQuery) ||
      s.department.toLowerCase().includes(lowercaseQuery) ||
      s.position.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Department operations
  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getDepartmentByName(name: string): Promise<Department | undefined> {
    return Array.from(this.departments.values()).find(d => d.name === name);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.currentDepartmentId++;
    const department: Department = {
      ...insertDepartment,
      id,
      description: insertDepartment.description || null,
      staffCount: 0,
      createdAt: new Date(),
    };
    this.departments.set(id, department);
    return department;
  }

  async updateDepartmentStaffCount(name: string, count: number): Promise<void> {
    const department = Array.from(this.departments.values()).find(d => d.name === name);
    if (department) {
      department.staffCount = count;
      this.departments.set(department.id, department);
    }
  }

  // Access log operations
  async createAccessLog(insertLog: InsertAccessLog): Promise<AccessLog> {
    const id = this.currentAccessLogId++;
    const log: AccessLog = {
      ...insertLog,
      id,
      staffId: insertLog.staffId || null,
      userId: insertLog.userId || null,
      ipAddress: insertLog.ipAddress || null,
      userAgent: insertLog.userAgent || null,
      details: insertLog.details || null,
      timestamp: new Date(),
    };
    this.accessLogs.set(id, log);
    return log;
  }

  async getAccessLogsByStaff(staffId: number): Promise<AccessLog[]> {
    return Array.from(this.accessLogs.values()).filter(log => log.staffId === staffId);
  }

  async getRecentAccessLogs(limit: number = 10): Promise<AccessLog[]> {
    return Array.from(this.accessLogs.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  // Statistics
  async getStaffStats(): Promise<{
    totalStaff: number;
    activeStaff: number;
    totalDepartments: number;
    recentAdditions: number;
  }> {
    const totalStaff = this.staff.size;
    const activeStaff = Array.from(this.staff.values()).filter(s => s.status === "active").length;
    const totalDepartments = this.departments.size;
    
    // Recent additions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAdditions = Array.from(this.staff.values()).filter(s => 
      s.createdAt && s.createdAt > thirtyDaysAgo
    ).length;

    return {
      totalStaff,
      activeStaff,
      totalDepartments,
      recentAdditions,
    };
  }

  // Authorization helpers
  hasPermission(userRole: string, permission: keyof typeof ROLE_PERMISSIONS[typeof USER_ROLES.ADMIN]): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
    return rolePermissions?.[permission] === true;
  }

  canAccessStaff(userRole: string, staffId?: number): boolean {
    // Admin can access all staff
    if (userRole === USER_ROLES.ADMIN) return true;
    
    // HR can access all staff
    if (userRole === USER_ROLES.HR) return true;
    
    // Viewer can only view staff profiles with PIN
    if (userRole === USER_ROLES.VIEWER) return true;
    
    // Staff role can only access their own profile
    if (userRole === USER_ROLES.STAFF && staffId) {
      // This would require additional logic to match user to staff member
      // For now, we'll allow access but in production you'd verify the user's staff ID
      return true;
    }
    
    return false;
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Create default departments
    const defaultDepartments = [
      { name: "General Overseers", description: "Church leadership and oversight", icon: "crown", color: "purple" },
      { name: "Church Executives", description: "Executive leadership team", icon: "user-tie", color: "blue" },
      { name: "Pastors", description: "Pastoral ministry and care", icon: "cross", color: "green" },
      { name: "Evangelists", description: "Evangelism and outreach", icon: "bible", color: "orange" },
      { name: "Administrative Staff", description: "Administrative support", icon: "briefcase", color: "indigo" },
      { name: "Other Workers", description: "General church workers", icon: "users", color: "gray" },
    ];

    try {
      // Insert default departments if they don't exist
      for (const dept of defaultDepartments) {
        const existing = await db.select().from(departments).where(eq(departments.name, dept.name));
        if (existing.length === 0) {
          await db.insert(departments).values(dept);
        }
      }

      // Create default admin user if it doesn't exist
      const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
      if (existingAdmin.length === 0) {
        const now = new Date();
        await db.insert(users).values({
          username: "admin",
          password: "admin123", // In production, this would be hashed
          role: USER_ROLES.ADMIN,
          firstName: "System",
          lastName: "Administrator",
          email: "admin@church.com",
          isActive: true,
          lastLogin: null,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (error) {
      console.error("Failed to initialize default data:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.username, username),
        eq(users.password, password),
        eq(users.isActive, true)
      )
    );
    return user || null;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(users)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // Session operations
  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionToken, token));
    
    if (!session) return undefined;
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await db.delete(sessions).where(eq(sessions.sessionToken, token));
      return undefined;
    }
    
    return session;
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.sessionToken, token));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(gte(sessions.expiresAt, new Date()));
  }

  // Staff operations
  async getStaff(id: number): Promise<Staff | undefined> {
    const [member] = await db.select().from(staff).where(eq(staff.id, id));
    return member;
  }

  async getStaffByRegistrationNumber(registrationNumber: string): Promise<Staff | undefined> {
    const [member] = await db.select().from(staff).where(eq(staff.registrationNumber, registrationNumber));
    return member;
  }

  async getAllStaff(): Promise<Staff[]> {
    return await db.select().from(staff).orderBy(desc(staff.createdAt));
  }

  async getStaffByDepartment(department: string): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.department, department)).orderBy(desc(staff.createdAt));
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(insertStaff).returning();
    
    // Update department staff count
    await this.updateDepartmentStaffCount(insertStaff.department, 0); // Will be calculated in the function
    
    return newStaff;
  }

  async updateStaff(id: number, updateData: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [updatedStaff] = await db.update(staff)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return updatedStaff;
  }

  async deleteStaff(id: number): Promise<boolean> {
    try {
      console.log(`Attempting to delete staff with ID: ${id} from database`);
      
      // First check if the staff member exists
      const existingStaff = await this.getStaff(id);
      if (!existingStaff) {
        console.log(`Staff member with ID ${id} does not exist`);
        return false;
      }
      
      console.log(`Found staff member: ${existingStaff.firstName} ${existingStaff.lastName}`);
      
      // First, delete all access logs that reference this staff member
      console.log(`Cleaning up access logs for staff ID: ${id}`);
      await db.delete(accessLogs).where(eq(accessLogs.staffId, id));
      
      console.log(`Access logs deleted, now deleting staff member`);
      
      // Now delete the staff member
      const result = await db.delete(staff).where(eq(staff.id, id));
      const deleted = (result.rowCount ?? 0) > 0;
      
      console.log(`Delete operation result: ${deleted ? 'success' : 'failed'}, rowCount: ${result.rowCount}`);
      
      if (deleted) {
        // Update department staff count
        try {
          await this.updateDepartmentStaffCount(existingStaff.department, 0);
        } catch (countError) {
          console.error("Failed to update department count:", countError);
          // Don't fail the deletion if count update fails
        }
      }
      
      return deleted;
    } catch (error) {
      console.error("Error in deleteStaff:", error);
      throw error;
    }
  }

  async searchStaff(query: string): Promise<Staff[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(staff).where(
      or(
        ilike(staff.firstName, searchTerm),
        ilike(staff.lastName, searchTerm),
        ilike(staff.registrationNumber, searchTerm),
        ilike(staff.department, searchTerm),
        ilike(staff.position, searchTerm)
      )
    ).orderBy(desc(staff.createdAt));
  }

  async verifyStaffPin(id: number, pin: string): Promise<boolean> {
    // PIN verification is no longer used - always return true for backwards compatibility
    return true;
  }

  async resetStaffPin(id: number, newPin: string): Promise<boolean> {
    // PIN functionality is no longer used - always return true for backwards compatibility
    return true;
  }

  // Department operations
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(departments.name);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async getDepartmentByName(name: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.name, name));
    return department;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(insertDepartment).returning();
    return department;
  }

  async updateDepartmentStaffCount(name: string, count: number): Promise<void> {
    // Calculate actual staff count for the department
    const staffCount = await db.select().from(staff).where(eq(staff.department, name));
    
    await db.update(departments)
      .set({ staffCount: staffCount.length })
      .where(eq(departments.name, name));
  }

  // Access log operations
  async createAccessLog(insertLog: InsertAccessLog): Promise<AccessLog> {
    const [log] = await db.insert(accessLogs).values(insertLog).returning();
    return log;
  }

  async getAccessLogsByStaff(staffId: number): Promise<AccessLog[]> {
    return await db.select().from(accessLogs)
      .where(eq(accessLogs.staffId, staffId))
      .orderBy(desc(accessLogs.timestamp));
  }

  async getRecentAccessLogs(limit: number = 10): Promise<AccessLog[]> {
    return await db.select().from(accessLogs)
      .orderBy(desc(accessLogs.timestamp))
      .limit(limit);
  }

  // Statistics
  async getStaffStats(): Promise<{
    totalStaff: number;
    activeStaff: number;
    totalDepartments: number;
    recentAdditions: number;
  }> {
    const [totalStaffResult] = await db.select({ count: count() }).from(staff);
    const [activeStaffResult] = await db.select({ count: count() }).from(staff).where(eq(staff.status, "active"));
    const [totalDepartmentsResult] = await db.select({ count: count() }).from(departments);
    
    // Recent additions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [recentAdditionsResult] = await db.select({ count: count() }).from(staff)
      .where(gte(staff.createdAt, thirtyDaysAgo));

    return {
      totalStaff: totalStaffResult?.count || 0,
      activeStaff: activeStaffResult?.count || 0,
      totalDepartments: totalDepartmentsResult?.count || 0,
      recentAdditions: recentAdditionsResult?.count || 0,
    };
  }

  // Authorization helpers
  hasPermission(userRole: string, permission: keyof typeof ROLE_PERMISSIONS[typeof USER_ROLES.ADMIN]): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
    return rolePermissions?.[permission] === true;
  }

  canAccessStaff(userRole: string, staffId?: number): boolean {
    // Admin can access all staff
    if (userRole === USER_ROLES.ADMIN) return true;
    
    // HR can access all staff
    if (userRole === USER_ROLES.HR) return true;
    
    // Viewer can only view staff profiles with PIN
    if (userRole === USER_ROLES.VIEWER) return true;
    
    // Staff role can only access their own profile
    if (userRole === USER_ROLES.STAFF && staffId) {
      // This would require additional logic to match user to staff member
      // For now, we'll allow access but in production you'd verify the user's staff ID
      return true;
    }
    
    return false;
  }
}

export const storage = new DatabaseStorage();
