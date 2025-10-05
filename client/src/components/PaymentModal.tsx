import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  serviceType: string;
  subtotal: number;
  tax: number;
  total: number;
}

export function PaymentModal({
  open,
  onOpenChange,
  jobTitle,
  serviceType,
  subtotal,
  tax,
  total,
}: PaymentModalProps) {
  const { toast } = useToast();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleConfirmPayment = () => {
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }
    console.log("Payment confirmed for:", jobTitle);
    toast({
      title: "Payment Successful!",
      description: "Your appointment has been confirmed.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-payment">
        <DialogHeader>
          <DialogTitle className="text-2xl">Prepayment Contract</DialogTitle>
          <DialogDescription>
            Review the details and complete your secure payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Job Details</h4>
            <div className="space-y-1">
              <p className="font-medium" data-testid="text-modal-job-title">{jobTitle}</p>
              <p className="text-sm text-muted-foreground" data-testid="text-modal-service-type">
                Service: {serviceType}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">Price Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span data-testid="text-tax">${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary" data-testid="text-total">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              data-testid="checkbox-terms"
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I agree to the terms and conditions and authorize the prepayment for this service.
              Payment will be processed securely.
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-payment"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={!termsAccepted}
            data-testid="button-confirm-payment"
          >
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
