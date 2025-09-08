import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Smartphone, Download, Eye } from "lucide-react";

export function IDCardInfo() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Automatic Staff ID Card Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Your profile details are automatically used to generate a digital staff ID card. 
          Each ID card includes a QR code for real-time verification of identity and employment status.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-600" />
            <span className="text-sm">View & Generate</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Download PNG</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-purple-600" />
            <span className="text-sm">QR Verification</span>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">🔒 Security:</span> All data is securely processed and stored in compliance with our organization's data protection policies.
            Please ensure your profile information is accurate and up to date to avoid delays or errors.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}