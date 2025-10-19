import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
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
import { Loader2 } from "lucide-react";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  console.error("VITE_STRIPE_PUBLIC_KEY is not defined. Stripe payments will not work.");
}

const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  serviceType: string;
  subtotal: number;
  tax: number;
  total: number;
  onPaymentSuccess?: (jobId: string) => void;
}

function PaymentForm({ 
  jobTitle, 
  serviceType, 
  subtotal, 
  tax, 
  total, 
  onCancel,
  onSuccess
}: {
  jobTitle: string;
  serviceType: string;
  subtotal: number;
  tax: number;
  total: number;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/payment-success",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toast({
        title: "Payment Successful!",
        description: "Your appointment has been confirmed.",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
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

      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground">Payment Information</h4>
        <PaymentElement />
      </div>

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

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          data-testid="button-cancel-payment"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !termsAccepted || isProcessing}
          data-testid="button-confirm-payment"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Confirm Payment"
          )}
        </Button>
      </div>
    </form>
  );
}

export function PaymentModal({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  serviceType,
  subtotal,
  tax,
  total,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string>("");

  useEffect(() => {
    if (open && jobId) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret))
        .catch((error) => console.error("Error creating payment intent:", error));
    }
  }, [open, jobId]);

  const handleSuccess = () => {
    onOpenChange(false);
    onPaymentSuccess?.(jobId);
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

        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              jobTitle={jobTitle}
              serviceType={serviceType}
              subtotal={subtotal}
              tax={tax}
              total={total}
              onCancel={() => onOpenChange(false)}
              onSuccess={handleSuccess}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
