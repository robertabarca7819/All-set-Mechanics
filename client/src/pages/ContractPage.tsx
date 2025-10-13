import { useRef, useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";
import type { Job } from "@shared/schema";

function SignaturePad({ 
  onSignatureChange, 
  label,
  testId 
}: { 
  onSignatureChange: (signature: string) => void;
  label: string;
  testId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="border rounded-md p-2 bg-background">
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          className="border rounded cursor-crosshair w-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          data-testid={testId}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          className="mt-2"
          data-testid={`${testId}-clear`}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

export default function ContractPage() {
  const [, params] = useRoute("/contract/:jobId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customerSignature, setCustomerSignature] = useState("");
  const [providerSignature, setProviderSignature] = useState("");

  const jobId = params?.jobId;

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json();
    },
    enabled: !!jobId,
  });

  const signContractMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}`, {
        contractTerms: contractTerms,
        customerSignature,
        providerSignature,
        signedAt: new Date(),
        status: "confirmed",
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      toast({
        title: "Contract Signed!",
        description: "Your contract has been signed successfully",
      });
      setTimeout(() => setLocation("/"), 2000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sign contract",
        variant: "destructive",
      });
    },
  });

  const contractTerms = job?.contractTerms || `SERVICE CONTRACT

This agreement is made on ${new Date().toLocaleDateString()} between:

Customer: [Customer Name]
Provider: Professional Auto Service

SERVICE DETAILS:
${job?.title || "Service"}
${job?.description || ""}

Location: ${job?.location || ""}
Scheduled Date: ${job?.preferredDate || ""} at ${job?.preferredTime || ""}

PAYMENT:
Total Amount: $${job?.estimatedPrice || 0}
Payment has been processed via Stripe.

TERMS:
1. The provider agrees to perform the services described above.
2. The customer agrees to pay the total amount as specified.
3. Both parties agree to the terms and conditions outlined in this contract.

By signing below, both parties agree to the terms of this contract.`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerSignature || !providerSignature) {
      toast({
        title: "Signatures Required",
        description: "Both customer and provider signatures are required",
        variant: "destructive",
      });
      return;
    }

    signContractMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card>
            <CardContent className="pt-6">
              <p>Job not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Service Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Contract Terms</h3>
                <div 
                  className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap font-mono"
                  data-testid="text-contract-terms"
                >
                  {contractTerms}
                </div>
              </div>

              <Separator />

              <form onSubmit={handleSubmit} className="space-y-6">
                <SignaturePad
                  label="Customer Signature"
                  onSignatureChange={setCustomerSignature}
                  testId="canvas-customer-signature"
                />

                <SignaturePad
                  label="Provider Signature"
                  onSignatureChange={setProviderSignature}
                  testId="canvas-provider-signature"
                />

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={signContractMutation.isPending || !customerSignature || !providerSignature}
                    data-testid="button-sign-contract"
                  >
                    {signContractMutation.isPending ? "Signing..." : "Sign Contract"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/admin")}
                    data-testid="button-cancel-contract"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
