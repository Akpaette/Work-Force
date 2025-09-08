import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  gender: text("gender").notNull(),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  department: text("department").notNull(),
  position: text("position").notNull(),
  employmentType: text("employment_type").notNull(),
  dateOfJoining: text("date_of_joining").notNull(),
  ordinationStatus: text("ordination_status"),
  dateOfOrdination: text("date_of_ordination"),
  
  // Additional Ministry Fields
  relationshipStatus: text("relationship_status"),
  spouseFirstName: text("spouse_first_name"),
  spouseLastName: text("spouse_last_name"),
  spouseOccupation: text("spouse_occupation"),
  spousePhone: text("spouse_phone"),
  spouseEmail: text("spouse_email"),
  primaryPlaceOfAssignment: text("primary_place_of_assignment"),
  previousMinistry: text("previous_ministry"),
  previousEmployment: text("previous_employment"),
  additionalBackground: text("additional_background"),
  
  educationLevel: text("education_level"),
  fieldOfStudy: text("field_of_study"),
  institution: text("institution"),
  certifications: text("certifications"),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactRelationship: text("emergency_contact_relationship").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  emergencyContactEmail: text("emergency_contact_email"),
  
  // Guarantor Information
  guarantorName: text("guarantor_name").notNull(),
  guarantorRelationship: text("guarantor_relationship").notNull(),
  guarantorPhone: text("guarantor_phone").notNull(),
  guarantorEmail: text("guarantor_email"),
  guarantorAddress: text("guarantor_address"),
  guarantorOccupation: text("guarantor_occupation"),
  
  profilePhoto: text("profile_photo"),
  documents: jsonb("documents").default([]),
  status: text("status").notNull().default("active").$type<"active" | "inactive" | "released" | "retired">(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  staffCount: integer("staff_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: jsonb("details"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  staffCount: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertAccessLogSchema = createInsertSchema(accessLogs).omit({
  id: true,
  timestamp: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Role permissions
export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin", 
  HR: "hr",
  STAFF: "staff",
  VIEWER: "viewer",
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: {
    canCreateUsers: true,
    canDeleteUsers: true,
    canManageRoles: true,
    canViewAllStaff: true,
    canCreateStaff: true,
    canEditStaff: true,
    canDeleteStaff: true,
    canBypassPIN: true,
    canResetPIN: true,
    canViewAuditLogs: true,
    canManageDepartments: true,
  },
  [USER_ROLES.ADMIN]: {
    canCreateUsers: false,
    canDeleteUsers: false,
    canManageRoles: false,
    canViewAllStaff: true,
    canCreateStaff: true,
    canEditStaff: true,
    canDeleteStaff: true,
    canBypassPIN: true,
    canResetPIN: true,
    canViewAuditLogs: true,
    canManageDepartments: true,
  },
  [USER_ROLES.HR]: {
    canCreateUsers: false,
    canDeleteUsers: false,
    canManageRoles: false,
    canViewAllStaff: true,
    canCreateStaff: true,
    canEditStaff: true,
    canDeleteStaff: false,
    canBypassPIN: false,
    canResetPIN: true,
    canViewAuditLogs: true,
    canManageDepartments: false,
  },
  [USER_ROLES.STAFF]: {
    canCreateUsers: false,
    canDeleteUsers: false,
    canManageRoles: false,
    canViewAllStaff: false,
    canCreateStaff: false,
    canEditStaff: false,
    canDeleteStaff: false,
    canBypassPIN: false,
    canResetPIN: false,
    canViewAuditLogs: false,
    canManageDepartments: false,
  },
  [USER_ROLES.VIEWER]: {
    canCreateUsers: false,
    canDeleteUsers: false,
    canManageRoles: false,
    canViewAllStaff: false,
    canCreateStaff: false,
    canEditStaff: false,
    canDeleteStaff: false,
    canBypassPIN: false,
    canResetPIN: false,
    canViewAuditLogs: false,
    canManageDepartments: false,
  },
} as const;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
