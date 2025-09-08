import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Shield, User, Calendar, Building2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface VerificationResponse {
  valid: boolean;
  staff?: {
    id: number;
    registrationNumber: string;
    fullName: string;
    department: string;
    position: string;
    status: string;
    profilePhoto?: string;
    dateOfJoining: string;
  };
  verifiedAt: string;
  message?: string;
}

export default function VerifyStaff() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const { data: verification, isLoading, error } = useQuery<VerificationResponse>({
    queryKey: ["/api/verify", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400">Verifying staff member...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verification Failed</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Unable to verify this staff member. The QR code may be invalid or the staff member may no longer be active.
              </p>
              <Button onClick={() => setLocation("/")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verification.valid || !verification.staff) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invalid Staff ID</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {verification.message || "This staff member could not be verified."}
              </p>
              <Button onClick={() => setLocation("/")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const staff = verification.staff;
  const verifiedDate = new Date(verification.verifiedAt);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <Shield className="h-6 w-6 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600">Verified Staff Member</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Verified at {verifiedDate.toLocaleString()}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Staff Photo and Basic Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
              {staff.profilePhoto ? (
                <img
                  src={staff.profilePhoto}
                  alt={staff.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {staff.fullName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {staff.position}
              </p>
            </div>
          </div>

          {/* Staff Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</Label>
                <Badge variant={staff.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                  {staff.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Number</Label>
                <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">
                  {staff.registrationNumber || `ID${staff.id.toString().padStart(4, '0')}`}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                Department
              </Label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">{staff.department}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Date of Joining
              </Label>
              <p className="text-sm text-gray-900 dark:text-white mt-1">
                {staff.dateOfJoining ? new Date(staff.dateOfJoining).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Organization Branding */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              SEED OF CHRIST GOSPEL CHURCH
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Staff Identity Verification System
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setLocation("/")} variant="outline" className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Verify Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}