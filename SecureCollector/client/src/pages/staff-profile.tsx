import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PhotoUpload } from "@/components/photo-upload";
import { IDCardGenerator } from "@/components/id-card-generator";
import { StatusSwitch } from "@/components/status-switch";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Shield,
  FileText,
  Clock,
  Edit,
  Save,
  X,
  Trash2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStaffSchema } from "@shared/schema";
import { useAuth, hasPermission } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DEPARTMENTS, EMPLOYMENT_TYPES, ORDINATION_STATUS, EDUCATION_LEVELS, GENDERS, STAFF_STATUS } from "@/lib/constants";
import type { Staff, InsertStaff } from "@shared/schema";
import { z } from "zod";

const updateStaffSchema = insertStaffSchema.partial();

export default function StaffProfile() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if edit mode is enabled from URL query
  const isEditMode = location.includes("edit=true");
  const [localEditMode, setLocalEditMode] = useState(isEditMode);
  
  const { data: staff, isLoading, error } = useQuery<Staff>({
    queryKey: ["/api/staff", id],
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const { data: accessLogs } = useQuery<any[]>({
    queryKey: ["/api/access-logs", { staffId: id }],
    enabled: !!id,
  });

  const form = useForm<z.infer<typeof updateStaffSchema>>({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: staff ? { ...staff, documents: staff.documents as any } : {},
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateStaffSchema>) => {
      console.log("Attempting to update staff with data:", data);
      console.log("Current auth token:", localStorage.getItem("authToken")?.substring(0, 8) + "...");
      
      const response = await apiRequest(`/api/staff/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      console.log("Staff update successful");
      queryClient.invalidateQueries({ queryKey: ["/api/staff", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setLocalEditMode(false);
      setLocation(`/staff-profile/${id}`);
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
    },
    onError: (error) => {
      console.error("Staff update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/staff/${id}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setLocation("/staff-records");
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

  const handleSaveClick = () => {
    form.handleSubmit((data) => {
      updateStaffMutation.mutate(data);
    })();
  };

  const handleCancelEdit = () => {
    setLocalEditMode(false);
    setLocation(`/staff-profile/${id}`);
    if (staff) {
      form.reset({ ...staff, documents: staff.documents as any });
    }
  };

  const handleDeleteStaff = () => {
    deleteStaffMutation.mutate();
  };

  // Update form values when staff data changes - use useEffect to prevent infinite loop
  React.useEffect(() => {
    if (staff && !localEditMode) {
      console.log("Resetting form with staff data:", staff.id);
      form.reset({ ...staff, documents: staff.documents as any });
    }
  }, [staff?.id]); // Only depend on staff ID, not updatedAt to avoid resets during editing
  
  // Initialize edit mode when entering with edit query param
  React.useEffect(() => {
    if (isEditMode && staff) {
      setLocalEditMode(true);
      console.log("Entering edit mode for staff:", staff.id);
    }
  }, [isEditMode, staff?.id]);

  if (isLoading) {
    console.log("Loading staff profile for ID:", id);
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!staff) {
    console.log("Staff data not found for ID:", id, "Error:", error);
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {error ? "Error loading staff member" : "Staff member not found"}
          </p>
          {error && (
            <p className="text-sm text-red-500 mt-2">
              {error.message || "Please try again or contact support"}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {staff.firstName} {staff.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{staff.position}</p>
            </div>
            
            {user && hasPermission(user.role, "canEditStaff") && (
              <div className="flex items-center gap-2">
                {localEditMode ? (
                  <>
                    <Button 
                      onClick={handleSaveClick}
                      disabled={updateStaffMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button 
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => setLocalEditMode(true)}
                      variant="outline"
                      size="sm"
                      title="Edit Staff"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <IDCardGenerator 
                      staff={staff} 
                      className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    />
                    
                    {hasPermission(user.role, "canDeleteStaff") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline"
                            size="sm"
                            title="Delete Staff"
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {staff.firstName} {staff.lastName}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteStaff}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    {staff.profilePhoto ? (
                      <img
                        src={staff.profilePhoto}
                        alt={`${staff.firstName} ${staff.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-gray-600 dark:text-gray-300">
                        {staff.firstName[0]}{staff.lastName[0]}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{staff.registrationNumber}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{staff.phone}</span>
                  </div>
                  
                  {staff.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{staff.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Joined {new Date(staff.dateOfJoining).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{staff.department}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StatusSwitch 
                      staff={staff} 
                      size="md"
                      disabled={!user || !hasPermission(user.role, "canEditStaff")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            {localEditMode ? (
              <Form {...form}>
                <form className="space-y-6">
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="personal">Personal</TabsTrigger>
                      <TabsTrigger value="ministry">Ministry</TabsTrigger>
                      <TabsTrigger value="education">Education</TabsTrigger>
                      <TabsTrigger value="emergency">Emergency</TabsTrigger>
                      <TabsTrigger value="guarantor">Guarantor</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="personal" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Profile Photo Upload */}
                          <FormField
                            control={form.control}
                            name="profilePhoto"
                            render={({ field }) => (
                              <FormItem>
                                <PhotoUpload
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="registrationNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Registration Number *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., PS-2023-001" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="dateOfBirth"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date of Birth</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="date" value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number *</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="tel" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="relationshipStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Relationship Status</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Relationship Status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="single">Single</SelectItem>
                                      <SelectItem value="married">Married</SelectItem>
                                      <SelectItem value="divorced">Divorced</SelectItem>
                                      <SelectItem value="widowed">Widowed</SelectItem>
                                      <SelectItem value="engaged">Engaged</SelectItem>
                                      <SelectItem value="separated">Separated</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Spouse Information - shown only if married */}
                          {form.watch("relationshipStatus") === "married" && (
                            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <h4 className="font-medium text-gray-900 dark:text-white">Spouse Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="spouseFirstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Spouse's First Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} value={field.value || ""} placeholder="Enter spouse's first name" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="spouseLastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Spouse's Last Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} value={field.value || ""} placeholder="Enter spouse's last name" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="spouseOccupation"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Spouse's Occupation</FormLabel>
                                      <FormControl>
                                        <Input {...field} value={field.value || ""} placeholder="Enter spouse's occupation" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="spousePhone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Spouse's Phone Number</FormLabel>
                                      <FormControl>
                                        <Input {...field} value={field.value || ""} type="tel" placeholder="Enter spouse's phone number" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="spouseEmail"
                                  render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                      <FormLabel>Spouse's Email Address</FormLabel>
                                      <FormControl>
                                        <Input {...field} value={field.value || ""} type="email" placeholder="Enter spouse's email address" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="ministry" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Ministry Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="department"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Department *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Department" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {DEPARTMENTS.map((dept) => (
                                        <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="position"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Position *</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="employmentType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Employment Type *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Employment Type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {EMPLOYMENT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="dateOfJoining"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date of Joining *</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="date" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="education" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Educational Background</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="educationLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Education Level</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Education Level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {EDUCATION_LEVELS.map((level) => (
                                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="fieldOfStudy"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field of Study</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="institution"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Institution</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="emergency" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Emergency Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="emergencyContactName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="emergencyContactRelationship"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Relationship *</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="emergencyContactPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number *</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="tel" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="emergencyContactEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="guarantor" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Guarantor Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="guarantorName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Guarantor Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="guarantorRelationship"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Relationship *</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="guarantorPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number *</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="tel" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="guarantorEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="guarantorOccupation"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Occupation</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="guarantorAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </form>
              </Form>
            ) : (
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="ministry">Ministry</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">{staff.gender}</p>
                        </div>
                      
                      {staff.dateOfBirth && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(staff.dateOfBirth).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      {staff.relationshipStatus && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Relationship Status</label>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">{staff.relationshipStatus}</p>
                        </div>
                      )}
                      
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                        <p className="text-sm text-gray-900 dark:text-white">{staff.address || "Not provided"}</p>
                      </div>
                    </div>
                    
                    {/* Spouse Information */}
                    {staff.relationshipStatus === "married" && (staff.spouseFirstName || staff.spouseLastName || staff.spouseOccupation || staff.spousePhone || staff.spouseEmail) && (
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-900 dark:text-white">Spouse Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(staff.spouseFirstName || staff.spouseLastName) && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Spouse's Name</label>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {[staff.spouseFirstName, staff.spouseLastName].filter(Boolean).join(' ')}
                              </p>
                            </div>
                          )}
                          
                          {staff.spouseOccupation && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Spouse's Occupation</label>
                              <p className="text-sm text-gray-900 dark:text-white">{staff.spouseOccupation}</p>
                            </div>
                          )}
                          
                          {staff.spousePhone && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Spouse's Phone</label>
                              <p className="text-sm text-gray-900 dark:text-white">{staff.spousePhone}</p>
                            </div>
                          )}
                          
                          {staff.spouseEmail && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Spouse's Email</label>
                              <p className="text-sm text-gray-900 dark:text-white">{staff.spouseEmail}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="ministry" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ministry Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                        <p className="text-sm text-gray-900 dark:text-white">{staff.department}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
                        <p className="text-sm text-gray-900 dark:text-white">{staff.position}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employment Type</label>
                        <p className="text-sm text-gray-900 dark:text-white capitalize">{staff.employmentType}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Joining</label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(staff.dateOfJoining).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {staff.ordinationStatus && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ordination Status</label>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">{staff.ordinationStatus}</p>
                        </div>
                      )}
                      
                      {staff.dateOfOrdination && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Ordination</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(staff.dateOfOrdination).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      {staff.primaryPlaceOfAssignment && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Place of Assignment</label>
                          <p className="text-sm text-gray-900 dark:text-white">{staff.primaryPlaceOfAssignment}</p>
                        </div>
                      )}
                    </div>
                    
                    {(staff.previousMinistry || staff.previousEmployment || staff.additionalBackground) && (
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-900 dark:text-white">Background Information</h4>
                        
                        {staff.previousMinistry && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Previous Ministry</label>
                            <p className="text-sm text-gray-900 dark:text-white">{staff.previousMinistry}</p>
                          </div>
                        )}
                        
                        {staff.previousEmployment && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Previous Employment</label>
                            <p className="text-sm text-gray-900 dark:text-white">{staff.previousEmployment}</p>
                          </div>
                        )}
                        
                        {staff.additionalBackground && (
                          <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Additional Background</label>
                            <p className="text-sm text-gray-900 dark:text-white">{staff.additionalBackground}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="education" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Educational Background
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {staff.educationLevel && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Education Level</label>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">{staff.educationLevel}</p>
                        </div>
                      )}
                      
                      {staff.fieldOfStudy && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Field of Study</label>
                          <p className="text-sm text-gray-900 dark:text-white">{staff.fieldOfStudy}</p>
                        </div>
                      )}
                      
                      {staff.institution && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Institution</label>
                          <p className="text-sm text-gray-900 dark:text-white">{staff.institution}</p>
                        </div>
                      )}
                      
                      {staff.certifications && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Certifications</label>
                          <p className="text-sm text-gray-900 dark:text-white">{staff.certifications}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="emergency" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Name</label>
                        <p className="text-sm text-gray-900 dark:text-white">{staff.emergencyContactName}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Relationship</label>
                        <p className="text-sm text-gray-900 dark:text-white">{staff.emergencyContactRelationship}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                        <p className="text-sm text-gray-900 dark:text-white">{staff.emergencyContactPhone}</p>
                      </div>
                      
                      {staff.emergencyContactEmail && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</label>
                          <p className="text-sm text-gray-900 dark:text-white">{staff.emergencyContactEmail}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            )}
          </div>
        </div>

        {/* Access Logs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Access Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accessLogs && accessLogs.slice(0, 10).map((log: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.action === "PIN_VERIFICATION_SUCCESS" ? "Profile accessed successfully" : "Failed PIN verification"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={log.action === "PIN_VERIFICATION_SUCCESS" ? "default" : "destructive"}>
                    {log.action === "PIN_VERIFICATION_SUCCESS" ? "Success" : "Failed"}
                  </Badge>
                </div>
              ))}
              
              {(!accessLogs || (accessLogs && accessLogs.length === 0)) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No access logs available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
