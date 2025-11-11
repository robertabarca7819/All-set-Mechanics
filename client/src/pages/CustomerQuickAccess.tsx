import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, User, DollarSign, AlertCircle, CheckCircle, Wrench, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import type { Job } from "@shared/schema";

export default function CustomerQuickAccess() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: jobs = [], isLoading: jobsLoading, error } = useQuery<Job[]>({
    queryKey: ["/api/customer/jobs-by-email"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "requested":
        return "secondary";
      case "accepted":
        return "default";
      case "deposit_due":
        return "destructive";
      case "payment_pending":
        return "destructive";
      case "confirmed":
        return "default";
      case "completed":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "requested":
        return { text: "Requested", icon: AlertCircle };
      case "accepted":
        return { text: "Accepted", icon: CheckCircle };
      case "deposit_due":
        return { text: "Deposit Due", icon: DollarSign };
      case "payment_pending":
        return { text: "Payment Pending", icon: DollarSign };
      case "confirmed":
        return { text: "Confirmed", icon: CheckCircle };
      case "completed":
        return { text: "Completed", icon: CheckCircle };
      default:
        return { text: status, icon: AlertCircle };
    }
  };

  // Show loading state
  if (authLoading || jobsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Show sign in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Customer Quick Access</CardTitle>
            <CardDescription>
              Sign in with your Google account to view and manage your auto repair jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.href = "/api/login"}
              className="w-full"
              size="lg"
              data-testid="button-sign-in-google"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <p>Quick and secure access to your repair job status</p>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/" data-testid="link-back-home">
              <Button variant="ghost" size="sm">
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show authenticated view with jobs
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Repair Jobs</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.firstName || user?.username || "Customer"}!
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Jobs Found</h3>
                <p className="text-muted-foreground mt-2">
                  You don't have any repair jobs yet. Visit our main page to request a service.
                </p>
                <Link href="/" data-testid="link-request-service">
                  <Button className="mt-4">
                    Request a Service
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            {jobs.map((job) => {
              const statusDisplay = getStatusDisplay(job.status);
              const StatusIcon = statusDisplay.icon;

              return (
                <Card key={job.id} data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription>{job.serviceType}</CardDescription>
                      </div>
                      <Badge variant={getStatusVariant(job.status)} className="ml-2">
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusDisplay.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{job.description}</p>
                    
                    <Separator />
                    
                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{job.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {job.appointmentDateTime 
                            ? format(new Date(job.appointmentDateTime), "PPP")
                            : `${job.preferredDate} at ${job.preferredTime}`}
                        </span>
                      </div>
                      
                      {job.estimatedPrice && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Estimated: ${job.estimatedPrice}</span>
                        </div>
                      )}
                      
                      {job.providerId && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Mechanic Assigned</span>
                        </div>
                      )}
                    </div>

                    {/* Additional status-specific information */}
                    {job.status === "deposit_due" && (
                      <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                        <p className="text-sm font-medium">
                          Deposit of ${job.depositAmount || 100} required
                        </p>
                      </div>
                    )}

                    {job.status === "payment_pending" && (
                      <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                        <p className="text-sm font-medium">
                          Payment pending for this job
                        </p>
                      </div>
                    )}

                    {job.mechanicCheckedInAt && (
                      <div className="bg-primary/10 text-primary p-3 rounded-md">
                        <p className="text-sm font-medium">
                          Mechanic checked in at {format(new Date(job.mechanicCheckedInAt), "p")}
                        </p>
                      </div>
                    )}

                    {job.mechanicCheckedOutAt && (
                      <div className="bg-primary/10 text-primary p-3 rounded-md">
                        <p className="text-sm font-medium">
                          Job completed at {format(new Date(job.mechanicCheckedOutAt), "p")}
                        </p>
                        {job.jobNotes && (
                          <p className="text-sm mt-1">Notes: {job.jobNotes}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      Created {format(new Date(job.createdAt), "PPp")}
                    </div>
                    {job.isUrgent === "true" && (
                      <Badge variant="destructive" className="ml-2">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Urgent
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}