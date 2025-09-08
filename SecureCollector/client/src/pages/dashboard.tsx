import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  HandHeart, 
  Building, 
  UserPlus, 
  Crown, 
  Bus, 
  Cross, 
  Book, 
  Briefcase, 
  ChevronRight,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import type { Department } from "@shared/schema";
import { DataExport } from "@/components/data-export";

const departmentIcons = {
  crown: Crown,
  "user-tie": Bus,
  cross: Cross,
  bible: Book,
  briefcase: Briefcase,
  users: Users,
};

const departmentColors = {
  purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
  blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
  orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
  indigo: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400",
  gray: "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: departments, isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: accessLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/access-logs"],
  });

  if (statsLoading || departmentsLoading || logsLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalStaff || 0}
                </p>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
                <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Ministers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.activeStaff || 0}
                </p>
              </div>
              <div className="p-3 bg-secondary-100 dark:bg-secondary-900 rounded-full">
                <HandHeart className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Departments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalDepartments || 0}
                </p>
              </div>
              <div className="p-3 bg-accent-100 dark:bg-accent-900 rounded-full">
                <Building className="h-6 w-6 text-accent-600 dark:text-accent-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recent Additions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.recentAdditions || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Folders */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Department Folders
          </h2>
          <div className="flex space-x-2">
            <DataExport />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments?.map((department) => {
            const IconComponent = departmentIcons[department.icon as keyof typeof departmentIcons] || Users;
            const colorClass = departmentColors[department.color as keyof typeof departmentColors] || departmentColors.gray;
            
            return (
              <Link key={department.id} href="/staff-records">
                <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-full mr-4 ${colorClass}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {department.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {department.staffCount} Members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Last Updated: Today
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accessLogs?.slice(0, 5).map((log: any, index: number) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {log.action === "PIN_VERIFICATION_SUCCESS" ? "Profile accessed" : "Access attempt"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            
            {(!accessLogs || accessLogs.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
