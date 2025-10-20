import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, MessageSquare, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type JobStatus = "requested" | "accepted" | "payment_pending" | "confirmed" | "completed";

interface JobCardProps {
  id: string;
  serviceType: string;
  title: string;
  description: string;
  location: string;
  preferredDate: string;
  preferredTime: string;
  estimatedPrice?: number | null;
  status: JobStatus;
  onAccept?: () => void;
  onViewDetails?: () => void;
  onMessage?: () => void;
}

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  requested: { label: "Requested", className: "bg-muted text-muted-foreground" },
  accepted: { label: "Accepted", className: "bg-primary text-primary-foreground" },
  payment_pending: { label: "Payment Pending", className: "bg-chart-3 text-white" },
  confirmed: { label: "Confirmed", className: "bg-chart-2 text-white" },
  completed: { label: "Completed", className: "bg-purple-500 text-white" },
};

// Helper function to format relative time (e.g., "2 hours ago")
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper function to get status badge variant
const getStatusVariant = (status: JobStatus): "secondary" | "default" | "destructive" | "outline" | "ghost" | "link" | null => {
  switch (status) {
    case "requested": return "secondary";
    case "accepted": return "default";
    case "payment_pending": return "outline";
    case "confirmed": return "default";
    case "completed": return "ghost";
    default: return "secondary";
  }
};

export function JobCard({
  serviceType,
  title,
  description,
  location,
  preferredDate,
  preferredTime,
  estimatedPrice,
  status,
  onAccept,
  onViewDetails,
  onMessage,
}: JobCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`card-job`}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
          <Badge variant="secondary" className="text-xs w-fit" data-testid="badge-service-type">
            {serviceType}
          </Badge>
          <span className="text-xs sm:text-sm text-muted-foreground" data-testid="text-relative-time">
            {formatRelativeTime(preferredDate)}
          </span>
        </div>
        <CardTitle className="text-lg sm:text-xl line-clamp-1" data-testid="text-job-title">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
        <p className="text-sm sm:text-base text-muted-foreground line-clamp-2" data-testid="text-description">
          {description}
        </p>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
          <span className="line-clamp-1" data-testid="text-location">{location}</span>
        </div>
        {preferredDate && (
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span data-testid="text-datetime">
              {preferredDate} at {preferredTime}
            </span>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 pt-2 sm:pt-4 border-t pt-4">
          {estimatedPrice !== null && estimatedPrice !== undefined && (
            <span className="text-xl sm:text-2xl font-bold text-primary" data-testid="text-price">
              <DollarSign className="h-5 w-5 inline-block mr-1" />
              {estimatedPrice}
            </span>
          )}
          <Badge className={statusInfo.className} data-testid="badge-status">
            {statusInfo.label}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 p-4 sm:p-6 pt-4">
        <div className="flex gap-2 ml-auto flex-wrap">
          {onMessage && (
            <Button variant="outline" size="sm" onClick={onMessage} data-testid="button-message">
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
          )}
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails} data-testid="button-view-details">
              View Details
            </Button>
          )}
          {onAccept && status === "requested" && (
            <Button size="sm" onClick={onAccept} data-testid="button-accept-job">
              Accept Job
            </Button>
          )}
          {status === "payment_pending" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Make Payment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Payment</DialogTitle>
                  <DialogDescription>
                    Complete payment for this service
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}