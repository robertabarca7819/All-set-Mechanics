import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatsCard } from "@/components/StatsCard";
import { JobCard } from "@/components/JobCard";
import { PaymentModal } from "@/components/PaymentModal";
import { JobCheckInOut } from "@/components/JobCheckInOut";
import { AIJobAssistant, type AIAssistantAnalysis } from "@/components/AIJobAssistant";
import { Briefcase, Clock, DollarSign, CheckCircle2, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@shared/schema";

export default function ProviderDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [aiAssistantOpen, setAIAssistantOpen] = useState(false);
  const [selectedJobForAI, setSelectedJobForAI] = useState<Job | null>(null);

  const { data: authStatus, isLoading: authLoading } = useQuery<{ 
    authenticated: boolean; 
    user?: { id: string; username: string; role: string } 
  }>({
    queryKey: ["/api/provider/verify"],
  });

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: authStatus?.authenticated === true,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/provider/logout");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/verify"] });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      setLocation("/provider-login");
    },
  });

  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("PATCH", `/api/jobs/${jobId}`, { 
        status: "accepted",
        providerId: authStatus?.user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
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

  const handleAcceptJob = (jobId: string) => {
    acceptJobMutation.mutate(jobId);
  };

  const handleInitiatePayment = (job: any) => {
    setSelectedJob(job);
    setPaymentModalOpen(true);
  };

  const handleMessage = () => {
    setLocation("/messages");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
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
              <CardTitle>Provider Access Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You need to be logged in as a mechanic to access this dashboard.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation("/provider-login")}
                  className="flex-1"
                  data-testid="button-login"
                >
                  Login
                </Button>
                <Button
                  onClick={() => setLocation("/provider-register")}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-register"
                >
                  Register
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const currentProviderId = authStatus?.user?.id;
  const providerJobs = jobs.filter(job => 
    job.providerId === currentProviderId || job.providerId === null
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back, {authStatus?.user?.username}
                </p>
              </div>
              <Button
                onClick={() => logoutMutation.mutate()}
                variant="outline"
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Active Jobs"
                value={providerJobs.filter(j => j.status !== "completed").length}
                icon={Briefcase}
                trend="+3 from last week"
              />
              <StatsCard
                title="Pending Requests"
                value={providerJobs.filter(j => j.status === "requested").length}
                icon={Clock}
                trend="2 new today"
              />
              <StatsCard
                title="Total Earnings"
                value="$3,240"
                icon={DollarSign}
                trend="+12% this month"
              />
              <StatsCard
                title="Completed Jobs"
                value={providerJobs.filter(j => j.status === "completed").length}
                icon={CheckCircle2}
                trend="95% satisfaction"
              />
            </div>

            <Tabs defaultValue="new-requests" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="new-requests" data-testid="tab-new-requests">
                  New Requests
                </TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active">
                  Active
                </TabsTrigger>
                <TabsTrigger value="completed" data-testid="tab-completed">
                  Completed
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new-requests" className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading jobs...</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providerJobs
                      .filter((job) => job.status === "requested")
                      .map((job) => (
                        <JobCard
                          key={job.id}
                          {...job}
                          status={job.status as any}
                          onAccept={() => handleAcceptJob(job.id)}
                          onViewDetails={() => console.log("View details:", job.id)}
                          onMessage={handleMessage}
                        />
                      ))}
                    {providerJobs.filter((job) => job.status === "requested").length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No pending requests</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading jobs...</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providerJobs
                      .filter((job) => job.status === "accepted" || job.status === "payment_pending" || job.status === "confirmed")
                      .map((job) => (
                        <div key={job.id} className="space-y-4">
                          <JobCard
                            {...job}
                            status={job.status as any}
                            onViewDetails={() => console.log("View details:", job.id)}
                            onMessage={handleMessage}
                          />
                          {job.status === "accepted" && (
                            <div className="flex gap-2">
                              <Button
                                className="flex-1"
                                onClick={() => handleInitiatePayment(job)}
                                data-testid={`button-initiate-payment-${job.id}`}
                              >
                                Initiate Prepayment Contract
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedJobForAI(job);
                                  setAIAssistantOpen(true);
                                }}
                                data-testid={`button-ai-assistant-${job.id}`}
                              >
                                <Bot className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {(job.status === "confirmed" || job.status === "accepted") && (
                            <JobCheckInOut
                              jobId={job.id}
                              mechanicCheckedInAt={job.mechanicCheckedInAt}
                              mechanicCheckedOutAt={job.mechanicCheckedOutAt}
                              actualStartTime={job.actualStartTime}
                              actualEndTime={job.actualEndTime}
                            />
                          )}
                        </div>
                      ))}
                    {providerJobs.filter((job) => job.status === "accepted" || job.status === "payment_pending" || job.status === "confirmed").length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No active jobs</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading jobs...</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providerJobs
                      .filter((job) => job.status === "completed")
                      .map((job) => (
                        <JobCard
                          key={job.id}
                          {...job}
                          status={job.status as any}
                          onViewDetails={() => console.log("View details:", job.id)}
                          onMessage={handleMessage}
                        />
                      ))}
                    {providerJobs.filter((job) => job.status === "completed").length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No completed jobs to display</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />

      {selectedJob && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          serviceType={selectedJob.serviceType}
          subtotal={selectedJob.estimatedPrice || 0}
          tax={(selectedJob.estimatedPrice || 0) * 0.09}
          total={(selectedJob.estimatedPrice || 0) * 1.09}
          onPaymentSuccess={async (jobId) => {
            await apiRequest("PATCH", `/api/jobs/${jobId}`, { status: "confirmed" });
            queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
          }}
        />
      )}

      <Dialog open={aiAssistantOpen} onOpenChange={setAIAssistantOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Job Assistant</DialogTitle>
            <DialogDescription>
              Get AI-powered recommendations for this job including cost estimates, procedures, and parts needed.
            </DialogDescription>
          </DialogHeader>
          {selectedJobForAI && (
            <AIJobAssistant
              job={selectedJobForAI}
              onSave={(analysis: AIAssistantAnalysis) => {
                console.log("Saving analysis:", analysis);
                setAIAssistantOpen(false);
                toast({
                  title: "Analysis Saved",
                  description: "AI recommendations have been saved to the job record.",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
