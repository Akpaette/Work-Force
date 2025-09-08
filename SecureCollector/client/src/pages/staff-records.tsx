import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Eye, Edit, Trash2, Plus, ChevronDown, ChevronRight, Crown, UserCheck, Cross, BookOpen, Briefcase, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth, hasPermission } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DEPARTMENTS } from "@/lib/constants";
import { IDCardGenerator } from "@/components/id-card-generator";
import { StatusSwitch } from "@/components/status-switch";
import type { Staff } from "@shared/schema";

export default function StaffRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [expandedDepartments, setExpandedDepartments] = useState<Record<string, boolean>>({});

  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const handleStaffClick = (staffId: number) => {
    // Navigate directly to staff profile without PIN verification
    setLocation(`/staff-profile/${staffId}`);
  };

  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      const response = await apiRequest(`/api/staff/${staffId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member",
        variant: "destructive",
      });
    },
  });

  const handleDeleteStaff = (staffId: number) => {
    deleteStaffMutation.mutate(staffId);
  };

  const handleEditStaff = (staffId: number) => {
    setLocation(`/staff-profile/${staffId}?edit=true`);
  };

  // Helper function to get department icon
  const getDepartmentIcon = (departmentName: string) => {
    switch (departmentName) {
      case "General Overseers":
        return <Crown className="h-5 w-5 text-purple-600" />;
      case "Church Executives":
        return <UserCheck className="h-5 w-5 text-blue-600" />;
      case "Pastors":
        return <Cross className="h-5 w-5 text-green-600" />;
      case "Evangelists":
        return <BookOpen className="h-5 w-5 text-orange-600" />;
      case "Administrative Staff":
        return <Briefcase className="h-5 w-5 text-indigo-600" />;
      default:
        return <Users className="h-5 w-5 text-gray-600" />;
    }
  };

  // Toggle department expansion
  const toggleDepartment = (department: string) => {
    setExpandedDepartments(prev => ({
      ...prev,
      [department]: !prev[department]
    }));
  };

  const filteredStaff = staff?.filter(member => {
    const matchesSearch = !searchQuery || 
      member.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || selectedDepartment === "all" || member.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  }) || [];

  // Group staff by department for automatic organization
  const groupedStaff = filteredStaff.reduce((groups, member) => {
    const department = member.department || "Other Workers";
    if (!groups[department]) {
      groups[department] = [];
    }
    groups[department].push(member);
    return groups;
  }, {} as Record<string, Staff[]>);

  // Define department order for consistent display
  const departmentOrder = DEPARTMENTS.map(dept => dept.name);

  // Get sorted departments that have staff
  const sortedDepartments = departmentOrder.filter(dept => groupedStaff[dept] && groupedStaff[dept].length > 0);


  React.useEffect(() => {
    if (sortedDepartments.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      sortedDepartments.forEach(dept => {
        initialExpanded[dept] = true;
      });
      setExpandedDepartments(initialExpanded);
    }
  }, [sortedDepartments.length]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Records</h2>
            {!user && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                View Only Mode - Admin login required for full access
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {user && hasPermission(user.role, "canCreateStaff") && (
              <Button
                onClick={() => setLocation("/add-staff")}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Display message when no staff found */}
      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedDepartment !== "all" ? "No staff members found matching your search." : "No staff members have been added yet."}
          </p>
          {user && hasPermission(user.role, "canCreateStaff") && !searchQuery && selectedDepartment === "all" && (
            <Button
              onClick={() => setLocation("/add-staff")}
              className="mt-4"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Staff Member
            </Button>
          )}
        </div>
      )}

      {/* Grouped Staff Display with Collapsible Departments */}
      {filteredStaff.length > 0 && (
        <div className="space-y-6">
          {sortedDepartments.map((department) => (
            <Collapsible
              key={department}
              open={expandedDepartments[department]}
              onOpenChange={() => toggleDepartment(department)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getDepartmentIcon(department)}
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {department}
                        </h3>
                        <Badge variant="outline" className="text-sm">
                          {groupedStaff[department].length} {groupedStaff[department].length === 1 ? 'member' : 'members'}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        {expandedDepartments[department] ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {groupedStaff[department].map((member) => (
                  <Card key={member.id} className="cursor-pointer hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-4 overflow-hidden">
                          {member.profilePhoto ? (
                            <img
                              src={member.profilePhoto}
                              alt={`${member.firstName} ${member.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {member.firstName} {member.lastName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.position}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Reg. Number:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.registrationNumber}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                          <StatusSwitch 
                            staff={member} 
                            size="sm"
                            disabled={!user || !hasPermission(user.role, "canEditStaff")}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStaffClick(member.id)}
                            className="w-full text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                          
                          <div className="flex items-center justify-center gap-1">
                            <IDCardGenerator 
                              staff={member}
                              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                            />
                            
                            {user && hasPermission(user.role, "canEditStaff") && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Edit Staff"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStaff(member.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                {user && hasPermission(user.role, "canDeleteStaff") && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Delete Staff"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete {member.firstName} {member.lastName}? This action cannot be undone and will permanently remove all their data.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteStaff(member.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
