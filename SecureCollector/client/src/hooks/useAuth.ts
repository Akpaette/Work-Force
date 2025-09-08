import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const token = localStorage.getItem("authToken");
  const storedUser = localStorage.getItem("user");
  
  // If no token, user is not authenticated
  if (!token) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        queryClient.clear();
      },
    };
  }

  // Parse stored user safely
  let initialUserData;
  try {
    initialUserData = storedUser ? JSON.parse(storedUser) : undefined;
  } catch (error) {
    console.error("Failed to parse stored user data:", error);
    initialUserData = undefined;
  }

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn<AuthUser>({ on401: "returnNull" }),
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute - shorter stale time for better auth state updates
    initialData: initialUserData,
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    queryClient.clear();
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}

// Helper function to check if user has permission
export function hasPermission(userRole: string | undefined, permission: string): boolean {
  if (!userRole) return false;
  
  // Define role permissions (should match backend)
  const rolePermissions = {
    admin: {
      canCreateStaff: true,
      canEditStaff: true,
      canDeleteStaff: true,
      canViewAllStaff: true,
      canResetStaffPin: true,
      canManageUsers: true,
      canViewAuditLogs: true,
      canExportData: true,
    },
    hr: {
      canCreateStaff: true,
      canEditStaff: true,
      canDeleteStaff: false,
      canViewAllStaff: true,
      canResetStaffPin: true,
      canManageUsers: false,
      canViewAuditLogs: true,
      canExportData: true,
    },
    viewer: {
      canCreateStaff: false,
      canEditStaff: false,
      canDeleteStaff: false,
      canViewAllStaff: true,
      canResetStaffPin: false,
      canManageUsers: false,
      canViewAuditLogs: false,
      canExportData: false,
    },
    staff: {
      canCreateStaff: false,
      canEditStaff: false,
      canDeleteStaff: false,
      canViewAllStaff: false,
      canResetStaffPin: false,
      canManageUsers: false,
      canViewAuditLogs: false,
      canExportData: false,
    },
  };

  const permissions = rolePermissions[userRole as keyof typeof rolePermissions];
  return permissions?.[permission as keyof typeof permissions] === true;
}