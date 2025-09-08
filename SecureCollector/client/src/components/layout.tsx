// Consolidated Layout Components for SecureCollector
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Search, Bell, Moon, Sun, Church, LayoutDashboard, FolderOpen, UserPlus, Users, BarChart3, Settings, LogOut, User, Check, X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button, Input, Badge } from "@/components/ui/index";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { STAFF_STATUS } from "@/lib/constants";
import type { Staff } from "@shared/schema";

// Header Component
interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function Header({ onMenuClick, title = "Church Staff Records" }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search by Registration Number, Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            
            {/* Notifications - Only show for authenticated users */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Sidebar Component
const publicNavigationItems = [
  { path: "/staff-records", label: "Staff Records", icon: FolderOpen },
];

const adminNavigationItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/staff-records", label: "Staff Records", icon: FolderOpen },
  { path: "/add-staff", label: "Add New Staff", icon: UserPlus },
  { path: "/departments", label: "Departments", icon: Users },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-center h-16 bg-primary-600 dark:bg-primary-700">
          <div className="flex items-center space-x-2">
            <Church className="text-white text-xl" />
            <span className="text-white font-semibold text-lg">Church Records</span>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full">
                <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="mt-8 flex-1">
          <div className="px-4 space-y-2">
            {(user ? adminNavigationItems : publicNavigationItems).map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer",
                      isActive && "bg-primary-50 dark:bg-primary-900 border-r-4 border-primary-500"
                    )}
                    onClick={() => onClose()}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* Auth Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {user ? (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button
                variant="default"
                className="w-full justify-start"
                onClick={() => onClose()}
              >
                <User className="mr-3 h-5 w-5" />
                Admin Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

// Status Switch Component
interface StatusSwitchProps {
  staff: Staff;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusSwitch({ staff, disabled = false, size = "md" }: StatusSwitchProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(staff.status);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentStatusConfig = STAFF_STATUS.find(status => status.value === staff.status) || STAFF_STATUS[0];

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiRequest(`/api/staff/${staff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...staff,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }),
      });
      return response.json();
    },
    onSuccess: (updatedStaff) => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff", staff.id.toString()] });
      queryClient.setQueryData(["/api/staff", staff.id.toString()], updatedStaff);
      
      setIsEditing(false);
      toast({
        title: "Status Updated",
        description: `Staff status changed to ${STAFF_STATUS.find(s => s.value === newStatus)?.label}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
      setSelectedStatus(staff.status);
    }
  });

  const handleSave = () => {
    if (selectedStatus !== staff.status) {
      updateStatusMutation.mutate(selectedStatus);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus(staff.status);
    setIsEditing(false);
  };

  const badgeSize = size === "sm" ? "text-xs px-2 py-0.5" : 
                   size === "lg" ? "text-sm px-4 py-1.5" : 
                   "text-xs px-3 py-1";

  const buttonSize = size === "sm" ? "h-6 w-6" : 
                    size === "lg" ? "h-10 w-10" : 
                    "h-8 w-8";

  if (disabled || !isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={currentStatusConfig.badge as any}
          className={`${badgeSize} font-medium transition-all duration-200 ${
            currentStatusConfig.color === 'green' ? 'bg-green-500 text-white hover:bg-green-600' :
            currentStatusConfig.color === 'red' ? 'bg-red-500 text-white hover:bg-red-600' :
            currentStatusConfig.color === 'orange' ? 'bg-orange-500 text-white hover:bg-orange-600' :
            currentStatusConfig.color === 'blue' ? 'bg-blue-500 text-white hover:bg-blue-600' :
            'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          <div className={`w-2 h-2 rounded-full bg-white/80 mr-1.5 ${
            currentStatusConfig.color === 'green' ? 'animate-pulse' : ''
          }`}></div>
          {currentStatusConfig.label}
        </Badge>
        {!disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <span className="text-xs">Edit</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select 
        value={selectedStatus} 
        onChange={(e) => setSelectedStatus(e.target.value)}
        className="w-36 h-8 px-3 rounded-md border border-input bg-background text-sm"
      >
        {STAFF_STATUS.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={updateStatusMutation.isPending}
          className={`${buttonSize} p-0 text-green-600 hover:text-green-700 hover:bg-green-50`}
        >
          {updateStatusMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={updateStatusMutation.isPending}
          className={`${buttonSize} p-0 text-red-600 hover:text-red-700 hover:bg-red-50`}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
