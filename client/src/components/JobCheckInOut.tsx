import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface JobCheckInOutProps {
  jobId: string;
  mechanicCheckedInAt: Date | null;
  mechanicCheckedOutAt: Date | null;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
}

export function JobCheckInOut({
  jobId,
  mechanicCheckedInAt,
  mechanicCheckedOutAt,
  actualStartTime,
  actualEndTime,
}: JobCheckInOutProps) {
  const { toast } = useToast();
  const [jobNotes, setJobNotes] = useState("");

  const checkInMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/jobs/${jobId}/check-in`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Checked In",
        description: "You have successfully checked in to the job site.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Check-In Failed",
        description: error.message || "Failed to check in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/jobs/${jobId}/check-out`, { jobNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Checked Out",
        description: "You have successfully checked out from the job site.",
      });
      setJobNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Check-Out Failed",
        description: error.message || "Failed to check out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateWorkingHours = () => {
    if (actualStartTime && actualEndTime) {
      const start = new Date(actualStartTime);
      const end = new Date(actualEndTime);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return null;
  };

  if (!mechanicCheckedInAt) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Job Site Check-In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Check in when you arrive at the job site
          </p>
          <Button
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            className="w-full"
            data-testid="button-check-in"
          >
            {checkInMutation.isPending ? "Checking In..." : "Check In"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mechanicCheckedInAt && !mechanicCheckedOutAt) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Checked In
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p className="text-muted-foreground">Check-in time:</p>
            <p className="font-medium" data-testid="text-check-in-time">
              {format(new Date(mechanicCheckedInAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Job Notes (optional)
            </label>
            <Textarea
              value={jobNotes}
              onChange={(e) => setJobNotes(e.target.value)}
              placeholder="Add notes about the work performed..."
              className="resize-none"
              rows={3}
              data-testid="textarea-job-notes"
            />
          </div>
          <Button
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending}
            className="w-full"
            data-testid="button-check-out"
          >
            {checkOutMutation.isPending ? "Checking Out..." : "Check Out"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const workingHours = calculateWorkingHours();

  if (!mechanicCheckedOutAt) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Job Completed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm">
            <p className="text-muted-foreground">Check-in:</p>
            <p className="font-medium" data-testid="text-check-in-time">
              {format(new Date(mechanicCheckedInAt!), "h:mm a")}
            </p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Check-out:</p>
            <p className="font-medium" data-testid="text-check-out-time">
              {format(new Date(mechanicCheckedOutAt), "h:mm a")}
            </p>
          </div>
        </div>
        {workingHours && (
          <div className="text-sm pt-2 border-t">
            <p className="text-muted-foreground">Working Hours:</p>
            <p className="font-semibold text-lg" data-testid="text-working-hours">
              {workingHours}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
