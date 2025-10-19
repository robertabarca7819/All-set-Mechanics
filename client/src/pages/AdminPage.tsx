import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Copy, Loader2, Filter, AlertCircle, Calendar, FileText } from "lucide-react";
import type { Job } from "@shared/schema";

const serviceTypes = [
  "Oil Change",
  "Brake Service",
  "Engine Repair",
  "Transmission Service",
  "Tire Replacement",
  "Electrical Diagnostics",
  "AC Repair",
  "General Inspection",
  "Other",
];

export default function AdminPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});
  const [depositLinks, setDepositLinks] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    status: "",
    serviceType: "",
    startDate: "",
    endDate: "",
    isUrgent: false,
  });

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
      return { res, jobId };
    },
    onSuccess: async ({ jobId }) => {
      const depositRes = await apiRequest("POST", `/api/deposits/${jobId}`);
      const depositData = await depositRes.json();
      if (depositData.checkoutUrl) {
        setDepositLinks({ ...depositLinks, [jobId]: depositData.checkoutUrl });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job Accepted",
        description: "$100 deposit required to lock in appointment",
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

  const generateDepositLinkMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiRequest("POST", `/api/deposits/${jobId}`);
      return res.json();
    },
    onSuccess: (data, jobId) => {
      if (data.checkoutUrl) {
        setDepositLinks({ ...depositLinks, [jobId]: data.checkoutUrl });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Deposit Link Generated",
        description: "Deposit payment link has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate deposit link",
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

  const filteredJobs = jobs?.filter((job) => {
    if (filters.status && job.status !== filters.status) return false;
    if (filters.serviceType && job.serviceType !== filters.serviceType) return false;
    if (filters.isUrgent && job.isUrgent !== "true") return false;
    if (filters.startDate && filters.endDate && job.appointmentDateTime) {
      const appointmentDate = new Date(job.appointmentDateTime);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      if (appointmentDate < startDate || appointmentDate > endDate) return false;
    }
    return true;
  });

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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/admin/calendar"}
                data-testid="button-calendar"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </Button>
              <Button 
                onClick={() => logoutMutation.mutate()}
                variant="outline"
                data-testid="button-admin-logout"
              >
                Logout
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger id="filter-status" data-testid="select-filter-status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="deposit_due">Deposit Due</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-service-type">Service Type</Label>
                  <Select
                    value={filters.serviceType}
                    onValueChange={(value) => setFilters({ ...filters, serviceType: value })}
                  >
                    <SelectTrigger id="filter-service-type" data-testid="select-filter-service-type">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-start-date">Start Date</Label>
                  <Input
                    id="filter-start-date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    data-testid="input-filter-start-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-end-date">End Date</Label>
                  <Input
                    id="filter-end-date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    data-testid="input-filter-end-date"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="filter-urgent"
                  checked={filters.isUrgent}
                  onCheckedChange={(checked) => setFilters({ ...filters, isUrgent: checked as boolean })}
                  data-testid="checkbox-filter-urgent"
                />
                <Label htmlFor="filter-urgent">Show only urgent requests</Label>
              </div>
            </CardContent>
          </Card>

          {jobsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs?.map((job) => (
                <Card key={job.id} data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2" data-testid={`text-job-title-${job.id}`}>
                          {job.title}
                          {job.isUrgent === "true" && (
                            <Badge className="bg-orange-500">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              URGENT
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.serviceType} - {job.location}
                        </p>
                        {job.customerEmail && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Customer: {job.customerEmail}
                          </p>
                        )}
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

                      {(job.status === "deposit_due" || job.status === "accepted") && depositLinks[job.id] && (
                        <div className="flex gap-2 w-full">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Deposit Link ($100)</Label>
                            <div className="flex gap-2">
                              <Input
                                value={depositLinks[job.id]}
                                readOnly
                                className="text-xs"
                                data-testid={`input-deposit-link-${job.id}`}
                              />
                              <Button
                                onClick={() => handleCopyLink(depositLinks[job.id])}
                                variant="outline"
                                size="icon"
                                data-testid={`button-copy-deposit-${job.id}`}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {job.status === "confirmed" && job.estimatedPrice && !generatedLinks[job.id] && !job.paymentLinkToken && (
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

                      {(job.status === "confirmed" || job.paymentStatus === "completed") && (
                        <Button
                          onClick={() => setLocation(`/contract/${job.id}`)}
                          variant="outline"
                          data-testid={`button-view-contract-${job.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Contract
                        </Button>
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
