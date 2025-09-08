import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IDCard } from "@/components/id-card";
import { Download, CreditCard, Loader2, Shield, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import JSZip from "jszip";
import type { Staff } from "@shared/schema";

interface IDCardGeneratorProps {
  staff: Staff;
  className?: string;
}

export function IDCardGenerator({ staff, className }: IDCardGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate QR code for staff verification
  const generateQRMutation = useMutation({
    mutationFn: async (staffId: number) => {
      const response = await apiRequest(`/api/staff/${staffId}/qr-code`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCodeUrl);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate QR code",
        variant: "destructive",
      });
    }
  });

  // Download both sides of ID card as ZIP
  const downloadIDCardZip = async () => {
    if (!frontCardRef.current || !backCardRef.current) {
      console.error('Card refs not available');
      toast({
        title: "Error", 
        description: "ID card elements not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      console.log('Starting ZIP download process...');
      
      const html2canvas = (await import('html2canvas')).default;
      const zip = new JSZip();

      // Temporarily make the elements visible for capture
      const container = frontCardRef.current.parentElement;
      if (container) {
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.zIndex = '10000';
        container.style.opacity = '1';
        container.style.backgroundColor = 'white';
      }

      // Wait for elements to be visible and rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Capturing front side...');
      // Capture front side
      const frontCanvas = await html2canvas(frontCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: false,
      });

      console.log('Capturing back side...');
      // Capture back side  
      const backCanvas = await html2canvas(backCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: false,
      });

      // Hide the elements again
      if (container) {
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.opacity = '0';
        container.style.zIndex = 'auto';
      }

      console.log('Converting to blobs...');
      // Check if canvases have content
      if (frontCanvas.width === 0 || frontCanvas.height === 0) {
        throw new Error('Front side canvas is empty');
      }
      if (backCanvas.width === 0 || backCanvas.height === 0) {
        throw new Error('Back side canvas is empty');
      }

      // Convert to blobs with error handling
      const frontBlob = await new Promise<Blob>((resolve, reject) => {
        frontCanvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create front side blob or blob is empty'));
          }
        }, 'image/png', 1.0);
      });

      const backBlob = await new Promise<Blob>((resolve, reject) => {
        backCanvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create back side blob or blob is empty'));
          }
        }, 'image/png', 1.0);
      });

      console.log(`Front blob size: ${frontBlob.size}, Back blob size: ${backBlob.size}`);

      console.log('Adding files to ZIP...');
      // Add both sides to ZIP
      const fileName = `${staff.firstName}-${staff.lastName}`.replace(/[^a-zA-Z0-9]/g, '-');
      zip.file(`${fileName}-ID-Card-Front.png`, frontBlob);
      zip.file(`${fileName}-ID-Card-Back.png`, backBlob);

      console.log('Generating ZIP file...');
      // Generate ZIP file and download
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      console.log(`ZIP blob size: ${zipBlob.size}`);
      
      const link = document.createElement('a');
      link.download = `${fileName}-ID-Card-Complete.zip`;
      link.href = URL.createObjectURL(zipBlob);
      
      // Ensure the link is added to the DOM temporarily
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 1000);

      console.log('Download completed successfully');
      toast({
        title: "Success",
        description: "ID card package downloaded successfully (both sides included)",
      });
    } catch (error) {
      console.error('Download error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error", 
        description: `Failed to download ID card package: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenCard = () => {
    setIsOpen(true);
    if (!qrCodeUrl) {
      generateQRMutation.mutate(staff.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`${className} hover:bg-gray-50 dark:hover:bg-gray-800`}
          onClick={handleOpenCard}
          title="Generate Staff ID Card"
        >
          <CreditCard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Digital Staff ID Card</DialogTitle>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Generate and download professional staff identification with modern design
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <IDCard 
              staff={staff} 
              qrCodeUrl={qrCodeUrl} 
            />
          </div>
          
          {/* Hidden elements for capturing both sides separately */}
          <div style={{ position: 'absolute', left: '-9999px', top: '0', opacity: 0 }}>
            <div ref={frontCardRef} style={{ width: '350px', height: '550px' }}>
              <IDCard 
                staff={staff} 
                qrCodeUrl={qrCodeUrl}
                forceSide="front"
              />
            </div>
            <div ref={backCardRef} style={{ width: '350px', height: '550px', marginTop: '20px' }}>
              <IDCard 
                staff={staff} 
                qrCodeUrl={qrCodeUrl}
                forceSide="back"
              />
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button 
              onClick={downloadIDCardZip}
              disabled={!qrCodeUrl || isDownloading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              {isDownloading ? 'Generating ZIP...' : 'Download Complete ID Card (ZIP)'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => generateQRMutation.mutate(staff.id)}
              disabled={generateQRMutation.isPending}
            >
              {generateQRMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Regenerate QR Code
            </Button>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Secure QR Verification</h4>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Each ID card includes a unique QR code for instant identity verification. 
              Scanning reveals employment status, department, and position in real-time.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-blue-600 dark:text-blue-400">
              <span>✓ Real-time verification</span>
              <span>✓ Secure data protection</span>
              <span>✓ Mobile-friendly scanning</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}