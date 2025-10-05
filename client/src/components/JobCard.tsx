import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign } from "lucide-react";

export type JobStatus = "requested" | "accepted" | "payment_pending" | "confirmed" | "completed";

interface JobCardProps {
  id: string;
  serviceType: string;
  title: string;
  description: string;
  location: string;
  preferredDate: string;
  preferredTime: string;
  estimatedPrice?: number;
  status: JobStatus;
  onAccept?: () => void;
  onViewDetails?: () => void;
}

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  requested: { label: "Requested", className: "bg-muted text-muted-foreground" },
  accepted: { label: "Accepted", className: "bg-primary text-primary-foreground" },
  payment_pending: { label: "Payment Pending", className: "bg-chart-3 text-white" },
  confirmed: { label: "Confirmed", className: "bg-chart-2 text-white" },
  completed: { label: "Completed", className: "bg-purple-500 text-white" },
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
}: JobCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-job`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" data-testid="badge-service-type">
            {serviceType}
          </Badge>
          <Badge className={statusInfo.className} data-testid="badge-status">
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className="text-lg font-semibold line-clamp-1" data-testid="text-job-title">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-description">
          {description}
        </p>
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground" data-testid="text-location">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground" data-testid="text-datetime">
              {preferredDate} at {preferredTime}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-4">
        {estimatedPrice && (
          <div className="flex items-center gap-1 text-primary font-semibold" data-testid="text-price">
            <DollarSign className="h-5 w-5" />
            <span className="text-lg">{estimatedPrice}</span>
          </div>
        )}
        <div className="flex gap-2 ml-auto">
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
        </div>
      </CardFooter>
    </Card>
  );
}
