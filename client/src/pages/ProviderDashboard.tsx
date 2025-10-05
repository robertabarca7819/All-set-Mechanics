import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatsCard } from "@/components/StatsCard";
import { JobCard } from "@/components/JobCard";
import { PaymentModal } from "@/components/PaymentModal";
import { Briefcase, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function ProviderDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const handleAcceptJob = (jobId: string) => {
    console.log("Accepting job:", jobId);
    toast({
      title: "Job Accepted!",
      description: "Customer will be notified to proceed with payment.",
    });
  };

  const handleInitiatePayment = (job: any) => {
    setSelectedJob(job);
    setPaymentModalOpen(true);
  };

  const handleMessage = () => {
    setLocation("/messages");
  };

  const mockJobs = [
    {
      id: "1",
      serviceType: "Brake Service",
      title: "Front brake pads replacement",
      description: "Squeaking noise when braking. Need front brake pads replaced on 2018 Honda Civic.",
      location: "San Francisco, CA 94105",
      preferredDate: "2025-10-15",
      preferredTime: "14:00",
      estimatedPrice: 250,
      status: "requested" as const,
    },
    {
      id: "2",
      serviceType: "Oil Change",
      title: "Synthetic oil change",
      description: "Regular maintenance oil change for 2020 Toyota Camry, synthetic oil preferred.",
      location: "Oakland, CA 94612",
      preferredDate: "2025-10-16",
      preferredTime: "10:00",
      estimatedPrice: 80,
      status: "requested" as const,
    },
    {
      id: "3",
      serviceType: "Engine Repair",
      title: "Check engine light diagnostics",
      description: "Check engine light came on. Need diagnostic scan and repair estimate.",
      location: "Berkeley, CA 94704",
      preferredDate: "2025-10-17",
      preferredTime: "09:00",
      estimatedPrice: 120,
      status: "accepted" as const,
    },
  ];

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
                value={12}
                icon={Briefcase}
                trend="+3 from last week"
              />
              <StatsCard
                title="Pending Requests"
                value={8}
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
                value={45}
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
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockJobs
                    .filter((job) => job.status === "requested")
                    .map((job) => (
                      <JobCard
                        key={job.id}
                        {...job}
                        onAccept={() => handleAcceptJob(job.id)}
                        onViewDetails={() => console.log("View details:", job.id)}
                        onMessage={handleMessage}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="active" className="mt-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockJobs
                    .filter((job) => job.status === "accepted")
                    .map((job) => (
                      <div key={job.id} className="space-y-4">
                        <JobCard
                          {...job}
                          onViewDetails={() => console.log("View details:", job.id)}
                          onMessage={handleMessage}
                        />
                        <Button
                          className="w-full"
                          onClick={() => handleInitiatePayment(job)}
                          data-testid={`button-initiate-payment-${job.id}`}
                        >
                          Initiate Prepayment Contract
                        </Button>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed jobs to display</p>
                </div>
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
