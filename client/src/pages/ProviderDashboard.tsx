import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatsCard } from "@/components/StatsCard";
import { JobCard } from "@/components/JobCard";
import { PaymentModal } from "@/components/PaymentModal";
import { Briefcase, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@shared/schema";

export default function ProviderDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("PATCH", `/api/jobs/${jobId}`, { 
        status: "accepted",
        providerId: "demo-user-1"
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

  const currentProviderId = "demo-user-1";
  const providerJobs = jobs.filter(job => 
    job.providerId === currentProviderId || job.providerId === null
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your jobs and track your performance
              </p>
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
                            <Button
                              className="w-full"
                              onClick={() => handleInitiatePayment(job)}
                              data-testid={`button-initiate-payment-${job.id}`}
                            >
                              Initiate Prepayment Contract
                            </Button>
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
          jobTitle={selectedJob.title}
          serviceType={selectedJob.serviceType}
          subtotal={selectedJob.estimatedPrice}
          tax={selectedJob.estimatedPrice * 0.09}
          total={selectedJob.estimatedPrice * 1.09}
        />
      )}
    </div>
  );
}
