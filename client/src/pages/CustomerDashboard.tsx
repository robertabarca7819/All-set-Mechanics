import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Calendar, Clock, MapPin, AlertCircle, Loader2 } from "lucide-react";
import type { Job } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function CustomerDashboard() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verificationStep, setVerificationStep] = useState<"email" | "code">("email");
  const [devCode, setDevCode] = useState("");
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; job: Job | null }>({
    open: false,
    job: null,
  });
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("customerAccessToken");
    if (storedToken) {
      setAccessToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const requestCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/customer/request-access", { email });
      return res.json();
    },
    onSuccess: (data) => {
      setVerificationStep("code");
      setDevCode(data.code);
      toast({
        title: "Verification Code Sent",
        description: `Code: ${data.code} (for dev/testing - in production this would be emailed)`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No jobs found for this email",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const res = await apiRequest("POST", "/api/customer/verify-access", data);
      return res.json();
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setIsAuthenticated(true);
      localStorage.setItem("customerAccessToken", data.accessToken);
      toast({
        title: "Access Granted",
        description: "You can now view your jobs",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid or expired verification code",
        variant: "destructive",
      });
    },
  });

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/customer/jobs", accessToken],
    enabled: isAuthenticated && !!accessToken,
    queryFn: async () => {
      const res = await fetch(`/api/customer/jobs?token=${accessToken}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async (data: { jobId: string; newDate: string; newTime: string; accessToken: string }) => {
      const res = await apiRequest("POST", "/api/customer/reschedule", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment) {
        window.location.href = data.checkoutUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/customer/jobs"] });
        setRescheduleDialog({ open: false, job: null });
        toast({
          title: "Success",
          description: data.message,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reschedule appointment",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (data: { jobId: string; accessToken: string }) => {
      const res = await apiRequest("POST", "/api/customer/cancel", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment) {
        window.location.href = data.checkoutUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/customer/jobs"] });
        toast({
          title: "Success",
          description: data.message,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    },
  });

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    requestCodeMutation.mutate(email);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCodeMutation.mutate({ email, code: verificationCode });
  };

  const handleTokenLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    localStorage.setItem("customerAccessToken", accessToken);
  };

  const handleReschedule = () => {
    if (!rescheduleDialog.job) return;
    rescheduleMutation.mutate({
      jobId: rescheduleDialog.job.id,
      newDate,
      newTime,
      accessToken,
    });
  };

  const handleCancel = (jobId: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      cancelMutation.mutate({ jobId, accessToken });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      requested: "bg-blue-500",
      accepted: "bg-blue-600",
      deposit_due: "bg-yellow-500",
      confirmed: "bg-green-500",
      completed: "bg-purple-500",
      cancelled: "bg-red-500",
    };
    return (
      <Badge className={statusColors[status] || "bg-gray-500"} data-testid={`badge-status-${status}`}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const canRescheduleOrCancel = (job: Job) => {
    if (!job.appointmentDateTime || job.status === "cancelled" || job.status === "completed") return false;
    const now = new Date();
    const appointmentDate = new Date(job.appointmentDateTime);
    const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0;
  };

  const getWarningMessage = (job: Job) => {
    if (!job.appointmentDateTime) return null;
    const now = new Date();
    const appointmentDate = new Date(job.appointmentDateTime);
    const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil < 24 && hoursUntil > 0) {
      return "Rescheduling or cancelling within 24 hours requires a $50 fee";
    }
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Customer Dashboard</CardTitle>
              <CardDescription>
                {verificationStep === "email" 
                  ? "Enter your email to receive a verification code"
                  : "Enter the 6-digit code sent to your email"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {verificationStep === "email" ? (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-customer-email"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={requestCodeMutation.isPending}
                    data-testid="button-request-access"
                  >
                    {requestCodeMutation.isPending ? "Sending Code..." : "Request Access"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    {devCode && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Dev Code: <span className="font-mono font-bold">{devCode}</span>
                      </p>
                    )}
                    <Input
                      id="code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      required
                      data-testid="input-verification-code"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setVerificationStep("email");
                        setVerificationCode("");
                        setDevCode("");
                      }}
                      className="w-full"
                      data-testid="button-back"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={verifyCodeMutation.isPending}
                      data-testid="button-verify-code"
                    >
                      {verifyCodeMutation.isPending ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                </form>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <form onSubmit={handleTokenLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Access Token</Label>
                  <Input
                    id="token"
                    placeholder="Enter your access token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    data-testid="input-access-token"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  data-testid="button-token-login"
                >
                  Access Dashboard
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
            <h1 className="text-3xl font-bold">My Jobs</h1>
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false);
                setAccessToken("");
                localStorage.removeItem("customerAccessToken");
              }}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No jobs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6" data-testid="div-jobs-list">
              {jobs.map((job) => (
                <Card key={job.id} data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{job.serviceType}</Badge>
                          {job.isUrgent === "true" && (
                            <Badge className="bg-orange-500">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              URGENT
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{job.description}</p>

                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{job.location}</span>
                      </div>
                      {job.appointmentDateTime && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(job.appointmentDateTime).toLocaleDateString()} at{" "}
                            {new Date(job.appointmentDateTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      {job.estimatedPrice && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            ${job.estimatedPrice} (est.)
                          </span>
                          {job.depositStatus === "paid" && (
                            <Badge variant="outline" className="text-xs">
                              $100 deposit paid
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {getWarningMessage(job) && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <p className="text-xs text-yellow-600">{getWarningMessage(job)}</p>
                      </div>
                    )}

                    {canRescheduleOrCancel(job) && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRescheduleDialog({ open: true, job });
                            setNewDate(job.preferredDate);
                            setNewTime(job.preferredTime);
                          }}
                          data-testid={`button-reschedule-${job.id}`}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Reschedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(job.id)}
                          data-testid={`button-cancel-${job.id}`}
                        >
                          Cancel Appointment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={rescheduleDialog.open} onOpenChange={(open) => setRescheduleDialog({ open, job: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Choose a new date and time for your appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-date">New Date</Label>
              <Input
                id="new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                data-testid="input-new-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-time">New Time</Label>
              <Input
                id="new-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                data-testid="input-new-time"
              />
            </div>
            <Button
              onClick={handleReschedule}
              className="w-full"
              disabled={rescheduleMutation.isPending}
              data-testid="button-confirm-reschedule"
            >
              {rescheduleMutation.isPending ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
