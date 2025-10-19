import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JobCheckInOut } from "@/components/JobCheckInOut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  MapPin,
  Clock,
  DollarSign,
  User,
  MessageSquare,
  FileText,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import type { Job } from "@shared/schema";

type JobStatus = "requested" | "accepted" | "payment_pending" | "confirmed" | "completed";

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  requested: { label: "Requested", className: "bg-muted text-muted-foreground" },
  accepted: { label: "Accepted", className: "bg-primary text-primary-foreground" },
  payment_pending: { label: "Payment Pending", className: "bg-chart-3 text-white" },
  confirmed: { label: "Confirmed", className: "bg-chart-2 text-white" },
  completed: { label: "Completed", className: "bg-purple-500 text-white" },
};

export default function JobDetailsPage() {
  const [match, params] = useRoute("/job/:jobId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const jobId = params?.jobId;

  const { data: authStatus } = useQuery<{
    authenticated: boolean;
    user?: { id: string; username: string; role: string };
  }>({
    queryKey: ["/api/provider/verify"],
  });

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json();
    },
    enabled: !!jobId,
  });

  const acceptJobMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/jobs/${jobId}`, {
        status: "accepted",
        providerId: authStatus?.user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      toast({
        title: "Job Accepted!",
        description: "Customer will be notified to proceed with payment.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAcceptJob = () => {
    acceptJobMutation.mutate();
  };

  const handleMessage = () => {
    setLocation("/messages");
  };

  const handleViewContract = () => {
    setLocation(`/contract/${jobId}`);
  };

  if (!match || !jobId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Job not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-job-details" />
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Job not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const statusInfo = statusConfig[job.status as JobStatus] || statusConfig.requested;
  const showCheckInOut = job.status === "accepted" || job.status === "confirmed";
  const showViewContract = job.paymentStatus === "completed" || job.status === "confirmed" || job.status === "completed";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/provider-dashboard")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">Job Details</h1>
            </div>

            <Card data-testid="card-job-details">
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl" data-testid="text-job-title">
                      {job.title}
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" data-testid="badge-service-type">
                        {job.serviceType}
                      </Badge>
                      <Badge className={statusInfo.className} data-testid="badge-status">
                        {statusInfo.label}
                      </Badge>
                      {job.isUrgent === "true" && (
                        <Badge variant="destructive" data-testid="badge-urgent">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                  {job.estimatedPrice && (
                    <div className="flex items-center gap-1 text-primary font-bold text-2xl" data-testid="text-price">
                      <DollarSign className="h-6 w-6" />
                      <span>{job.estimatedPrice}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground" data-testid="text-description">
                    {job.description}
                  </p>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-location">
                          {job.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Preferred Date & Time</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-datetime">
                          {job.preferredDate} at {job.preferredTime}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {job.customerEmail && (
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Customer</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-customer-email">
                            {job.customerEmail}
                          </p>
                        </div>
                      </div>
                    )}
                    {job.providerId && authStatus?.user && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Assigned Mechanic</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-mechanic-username">
                            {authStatus.user.username}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {job.depositStatus === "paid" && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-chart-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Deposit Paid (${job.depositAmount || 100})
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex gap-3 flex-wrap">
                  {job.status === "requested" && (
                    <Button
                      onClick={handleAcceptJob}
                      disabled={acceptJobMutation.isPending}
                      data-testid="button-accept-job"
                    >
                      {acceptJobMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        "Accept Job"
                      )}
                    </Button>
                  )}

                  {showCheckInOut && (
                    <JobCheckInOut
                      jobId={job.id}
                      mechanicCheckedInAt={job.mechanicCheckedInAt}
                      mechanicCheckedOutAt={job.mechanicCheckedOutAt}
                      actualStartTime={job.actualStartTime}
                      actualEndTime={job.actualEndTime}
                    />
                  )}

                  {showViewContract && (
                    <Button
                      onClick={handleViewContract}
                      variant="outline"
                      data-testid="button-view-contract"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Contract
                    </Button>
                  )}

                  <Button
                    onClick={handleMessage}
                    variant="outline"
                    data-testid="button-message"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
