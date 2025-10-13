import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Copy, Loader2 } from "lucide-react";
import type { Job } from "@shared/schema";

export default function AdminPage() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});

  const { data: authStatus, isLoading: authLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/verify"],
  });

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest("POST", "/api/admin/login", { password });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verify"] });
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard",
      });
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid password",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/logout");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verify"] });
      setGeneratedLinks({});
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
    },
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: authStatus?.authenticated === true,
  });

  const acceptJobMutation = useMutation({
    mutationFn: async ({ jobId, estimatedPrice }: { jobId: string; estimatedPrice: number }) => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}`, {
        status: "accepted",
        providerId: "demo-user-1",
        estimatedPrice,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job Accepted",
        description: "Job has been accepted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept job",
        variant: "destructive",
      });
    },
  });

  const generatePaymentLinkMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiRequest("POST", "/api/checkout-sessions", { jobId });
      return res.json();
    },
    onSuccess: (data, jobId) => {
      const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
      const paymentLink = `${baseUrl}/pay/${data.paymentLinkToken}`;
      setGeneratedLinks({ ...generatedLinks, [jobId]: paymentLink });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Payment Link Generated",
        description: "Payment link has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate payment link",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(password);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Payment link copied to clipboard",
    });
  };

  const handleAcceptJob = (jobId: string) => {
    const price = prompt("Enter estimated price:");
    if (price && !isNaN(Number(price))) {
      acceptJobMutation.mutate({ jobId, estimatedPrice: Number(price) });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!authStatus?.authenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-admin-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-admin-login"
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
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
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Button 
              onClick={() => logoutMutation.mutate()}
              variant="outline"
              data-testid="button-admin-logout"
            >
              Logout
            </Button>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {jobs?.map((job) => (
                <Card key={job.id} data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl" data-testid={`text-job-title-${job.id}`}>
                          {job.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.serviceType} - {job.location}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge data-testid={`badge-status-${job.id}`}>{job.status}</Badge>
                        {job.paymentStatus && (
                          <Badge variant="secondary" data-testid={`badge-payment-${job.id}`}>
                            {job.paymentStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{job.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">Date:</span> {job.preferredDate}
                      </div>
                      <div>
                        <span className="font-semibold">Time:</span> {job.preferredTime}
                      </div>
                      {job.estimatedPrice && (
                        <div>
                          <span className="font-semibold">Price:</span> ${job.estimatedPrice}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {job.status === "requested" && (
                        <Button
                          onClick={() => handleAcceptJob(job.id)}
                          disabled={acceptJobMutation.isPending}
                          data-testid={`button-accept-${job.id}`}
                        >
                          Accept Job
                        </Button>
                      )}

                      {job.status === "accepted" && job.estimatedPrice && !generatedLinks[job.id] && !job.paymentLinkToken && (
                        <Button
                          onClick={() => generatePaymentLinkMutation.mutate(job.id)}
                          disabled={generatePaymentLinkMutation.isPending}
                          data-testid={`button-generate-link-${job.id}`}
                        >
                          Generate Payment Link
                        </Button>
                      )}

                      {(generatedLinks[job.id] || job.paymentLinkToken) && (
                        <div className="flex gap-2 w-full">
                          <Input
                            value={generatedLinks[job.id] || `${import.meta.env.VITE_BASE_URL || window.location.origin}/pay/${job.paymentLinkToken}`}
                            readOnly
                            data-testid={`input-payment-link-${job.id}`}
                          />
                          <Button
                            onClick={() => handleCopyLink(generatedLinks[job.id] || `${import.meta.env.VITE_BASE_URL || window.location.origin}/pay/${job.paymentLinkToken}`)}
                            variant="outline"
                            size="icon"
                            data-testid={`button-copy-link-${job.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
