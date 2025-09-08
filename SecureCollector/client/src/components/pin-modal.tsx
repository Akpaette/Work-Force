import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (staffData: any) => void;
  staffId: number;
}

export function PinModal({ isOpen, onClose, onSuccess, staffId }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("PIN verification successful:", data);
        
        if (data.staff) {
          onSuccess(data.staff);
          onClose();
          setPin("");
        } else {
          toast({
            title: "Error",
            description: "Staff data not found",
            variant: "destructive",
          });
        }
      } else {
        const error = await response.json();
        console.error("PIN verification failed:", error);
        toast({
          title: "Access Denied",
          description: error.message || "Invalid PIN",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
            <Lock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <DialogTitle className="text-center">Enter PIN</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Please enter your PIN to access this staff profile
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <Input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-32 text-center text-2xl font-bold tracking-widest"
              placeholder="••••"
              disabled={loading}
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || pin.length !== 4}
            >
              {loading ? "Verifying..." : "Access Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
