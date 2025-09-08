import { forwardRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import churchLogo from "@/assets/church-logo.jpeg";
import { STAFF_STATUS } from "@/lib/constants";
import type { Staff } from "@shared/schema";

interface IDCardProps {
  staff: Staff;
  qrCodeUrl?: string;
  forceSide?: "front" | "back";
}

const IDCard = forwardRef<HTMLDivElement, IDCardProps>(({ staff, qrCodeUrl, forceSide }, ref) => {
  const [showBack, setShowBack] = useState(false);
  
  // Override showBack state if forceSide is provided
  const displayBack = forceSide ? forceSide === "back" : showBack;
  // Format date for ID card
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status configuration
  const statusConfig = STAFF_STATUS.find(status => status.value === staff.status) || STAFF_STATUS[0];

  return (
    <div className="relative">
      {/* Flip Button - only show if not forced to a specific side */}
      {!forceSide && (
        <div className="absolute -top-12 right-0 z-10">
          <Button
            onClick={() => setShowBack(!showBack)}
            variant="outline"
            size="sm"
            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {showBack ? 'Show Front' : 'Show Back'}
          </Button>
        </div>
      )}

      <div ref={ref} className="w-[350px] h-[550px] bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden relative">
        {!displayBack ? (
          // FRONT SIDE
          <>
            {/* Header - Simple and Clean */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                  <img 
                    src={churchLogo} 
                    alt="Church Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const nextSibling = target.nextElementSibling as HTMLElement;
                      if (nextSibling) nextSibling.style.display = 'block';
                    }}
                  />
                  <span className="text-blue-600 font-bold text-sm hidden">SOCG</span>
                </div>
                <div className="text-center">
                  <h3 className="text-white font-bold text-lg">SEED OF CHRIST</h3>
                  <h4 className="text-white font-bold text-lg">GOLDEN CHURCH</h4>
                </div>
              </div>
              <p className="text-white text-sm font-semibold text-center">STAFF IDENTIFICATION CARD</p>
            </div>

            {/* Front Content */}
            <div className="px-6 py-6 bg-white flex-1 flex flex-col">
              
              {/* Profile Photo - Centered and Large */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-44 h-52 bg-gray-100 rounded-2xl overflow-hidden border-4 border-gray-200 shadow-lg">
                    {staff.profilePhoto ? (
                      <img
                        src={staff.profilePhoto}
                        alt={`${staff.firstName} ${staff.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100">
                        <span className="text-blue-600 font-bold text-5xl">
                          {staff.firstName[0]}{staff.lastName[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Status Badge */}
                  <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                    statusConfig.color === 'green' ? 'bg-green-500' :
                    statusConfig.color === 'red' ? 'bg-red-500' :
                    statusConfig.color === 'orange' ? 'bg-orange-500' :
                    statusConfig.color === 'blue' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}>
                    {statusConfig.label.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Staff Name and Position */}
              <div className="text-center mb-6">
                <h2 className="font-bold text-2xl text-gray-900 mb-1">
                  {staff.firstName} {staff.lastName}
                </h2>
                <p className="text-lg text-gray-600 font-semibold">{staff.position}</p>
                <p className="text-base text-gray-500 mt-1">{staff.department}</p>
              </div>

              {/* Staff Information */}
              <div className="space-y-3 mb-8">
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">Staff ID:</span>
                    <span className="text-sm font-mono font-bold text-gray-900">
                      {staff.registrationNumber || staff.id.toString().padStart(6, '0')}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">Date Joined:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(staff.dateOfJoining) || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">Status:</span>
                    <Badge variant="secondary" className={`text-xs font-semibold ${
                      statusConfig.color === 'green' ? 'bg-green-100 text-green-800' :
                      statusConfig.color === 'red' ? 'bg-red-100 text-red-800' :
                      statusConfig.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      statusConfig.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Note to flip card */}
              <div className="flex-1 flex items-end justify-center pb-4">
                <p className="text-gray-500 text-sm text-center">
                  <span className="font-semibold">Flip card</span> to see QR code<br/>
                  and official authorization
                </p>
              </div>
            </div>

            {/* Footer - Simple */}
            <div className="bg-gray-100 px-6 py-3 border-t border-gray-300">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-semibold">
                  Valid through {new Date().getFullYear()} • Official Staff ID • FRONT
                </p>
              </div>
            </div>
          </>
        ) : (
          // BACK SIDE
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-blue-600 px-6 py-4">
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-1">OFFICIAL AUTHORIZATION</h3>
                <p className="text-white/90 text-sm font-semibold">Staff Identity Verification</p>
              </div>
            </div>

            {/* Back Content */}
            <div className="px-6 py-4 bg-white flex-1 flex flex-col">
              
              {/* Official Write-up */}
              <div className="mb-4">
                <div className="border-2 border-blue-100 rounded-xl p-3 bg-blue-50/30">
                  <h4 className="font-bold text-base text-gray-900 mb-2 text-center">OFFICIAL CERTIFICATION</h4>
                  <p className="text-xs text-gray-800 leading-relaxed text-justify">
                    This is to certify that <strong>{staff.firstName} {staff.lastName}</strong> is an officially recognized staff member of Seed of Christ Golden Church. The bearer is authorized to perform duties as <strong>{staff.position}</strong> within the <strong>{staff.department}</strong> department.
                  </p>
                  <p className="text-xs text-gray-800 leading-relaxed text-justify mt-2">
                    This identification card serves as proof of employment and authorization to represent the church in official capacities as defined by church policy and leadership directives.
                  </p>
                </div>
              </div>

              {/* QR Code Section - Compact Size */}
              <div className="flex flex-col items-center justify-center mb-2">
                <div className="bg-white border-3 border-blue-200 rounded-xl p-2 shadow-lg">
                  <div className="w-36 h-36 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-blue-50 flex items-center justify-center border-2 border-dashed border-blue-300 rounded-lg">
                        <div className="text-center">
                          <div className="text-blue-500 text-xl mb-1">⬜</div>
                          <span className="text-blue-600 text-xs font-semibold">Loading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-blue-600 text-base font-bold">SCAN TO VERIFY</p>
                  <p className="text-gray-600 text-xs font-semibold">Staff Identity & Employment Status</p>
                </div>
              </div>

              {/* Signatures Section */}
              <div className="border-t border-gray-200 pt-2 mt-auto">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="border-b-2 border-gray-300 mb-1 pb-4">
                      <div className="text-gray-400 text-xs italic">Digital Signature</div>
                    </div>
                    <p className="text-xs font-bold text-gray-800">GENERAL OVERSEER</p>
                    <p className="text-xs text-gray-600">Pastor [GO Name]</p>
                  </div>
                  <div className="text-center">
                    <div className="border-b-2 border-gray-300 mb-1 pb-4">
                      <div className="text-gray-400 text-xs italic">Digital Signature</div>
                    </div>
                    <p className="text-xs font-bold text-gray-800">ADMINISTRATOR</p>
                    <p className="text-xs text-gray-600">Admin Officer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 px-6 py-3 border-t border-gray-300">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-semibold">
                  Issued: {new Date().toLocaleDateString()} • Official Staff ID • BACK
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

IDCard.displayName = "IDCard";

export { IDCard };