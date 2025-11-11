import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Link } from "wouter";
import { CalendarDays, MapPin, DollarSign, LogOut, Mail, User, Wrench } from "lucide-react";
import type { Job } from "@shared/schema";

export default function QuickAccess() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isLoadingAuth, isAuthenticated } = useAuth();

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/customer/jobs-by-email"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoadingAuth && !isAuthenticated) {
      setLocation("/customer-login");
    }
  }, [isLoadingAuth, isAuthenticated, setLocation]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "requested": return "secondary";
      case "accepted": return "default";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoadingAuth || isLoadingJobs) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold" data-testid="text-welcome">
              Welcome{user?.claims?.name ? `, ${user.claims.name}` : ""}!
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span data-testid="text-email">{user?.claims?.email || "Quick Access User"}</span>
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Service Requests</h2>
          
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Service Requests Yet</h3>
                <p className="text-muted-foreground mb-6" data-testid="text-no-jobs">
                  You haven't requested any services yet. Need mechanical assistance?
                </p>
                <div className="space-y-3">
                  <Link href="/request">
                    <Button data-testid="button-request-service">
                      Request a Service
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Or contact us directly for immediate assistance
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Card key={job.id} className="hover-elevate" data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={getStatusBadgeVariant(job.status)} data-testid={`badge-status-${job.id}`}>
                        {job.status}
                      </Badge>
                      {job.isUrgent === "true" && (
                        <Badge variant="destructive">Urgent</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription>{job.serviceType}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-location-${job.id}`}>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-date-${job.id}`}>
                          {formatDate(job.preferredDate)} at {job.preferredTime}
                        </span>
                      </div>
                      {job.estimatedPrice && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold" data-testid={`text-price-${job.id}`}>
                            ${job.estimatedPrice}
                          </span>
                        </div>
                      )}
                      {job.providerId && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-primary">Mechanic Assigned</span>
                        </div>
                      )}
                    </div>
                    
                    {job.status === "accepted" && job.paymentLinkToken && (
                      <Link href={`/contract/${job.id}?token=${job.paymentLinkToken}`}>
                        <Button variant="default" size="sm" className="w-full" data-testid={`button-view-contract-${job.id}`}>
                          View Contract
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Have questions about your service requests or need to schedule a new appointment?
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/request">
                <Button variant="outline" data-testid="button-new-request">
                  Request New Service
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" data-testid="button-learn-more">
                  Learn More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}