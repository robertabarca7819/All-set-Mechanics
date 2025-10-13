import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle } from "lucide-react";

const serviceTypes = [
  "Oil Change",
  "Brake Service",
  "Engine Repair",
  "Transmission Service",
  "Tire Replacement",
  "Electrical Diagnostics",
  "AC Repair",
  "General Inspection",
  "Other",
];

export function JobRequestForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    serviceType: "",
    title: "",
    description: "",
    location: "",
    preferredDate: "",
    preferredTime: "",
    customerEmail: "",
    isUrgent: false,
  });
  const [accessToken, setAccessToken] = useState<string>("");

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      return res.json();
    },
    onSuccess: async (data) => {
      const requestRes = await apiRequest("POST", "/api/customer/request-access", {
        email: formData.customerEmail,
      });
      const requestData = await requestRes.json();
      setAccessToken(requestData.accessToken);
      
      toast({
        title: "Request Submitted!",
        description: "Save your access token to track your job.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit job request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const appointmentDateTime = new Date(`${formData.preferredDate}T${formData.preferredTime}:00Z`);
    const responseDeadline = formData.isUrgent 
      ? new Date(Date.now() + 3 * 60 * 60 * 1000)
      : null;

    const jobData = {
      serviceType: formData.serviceType,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      preferredDate: formData.preferredDate,
      preferredTime: formData.preferredTime,
      customerEmail: formData.customerEmail,
      isUrgent: formData.isUrgent ? "true" : "false",
      responseDeadline,
      appointmentDateTime,
      customerId: "customer-" + Date.now(),
    };

    createJobMutation.mutate(jobData);
  };

  return (
    <Card className="max-w-2xl mx-auto" data-testid="card-job-request-form">
      <CardHeader>
        <CardTitle className="text-2xl">Request a Service</CardTitle>
        <CardDescription>
          Fill out the form below and get matched with qualified mechanics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="service-type">Service Type</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) =>
                setFormData({ ...formData, serviceType: value })
              }
            >
              <SelectTrigger id="service-type" data-testid="select-service-type">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              placeholder="e.g., Front brake pads replacement"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              data-testid="input-job-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about the issue or service needed..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="min-h-[120px] resize-y"
              data-testid="input-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Your address or zip code"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              data-testid="input-location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-email">Email Address</Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="your@email.com"
              value={formData.customerEmail}
              onChange={(e) =>
                setFormData({ ...formData, customerEmail: e.target.value })
              }
              required
              data-testid="input-customer-email"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-date">Preferred Date</Label>
              <Input
                id="preferred-date"
                type="date"
                value={formData.preferredDate}
                onChange={(e) =>
                  setFormData({ ...formData, preferredDate: e.target.value })
                }
                data-testid="input-preferred-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred-time">Preferred Time</Label>
              <Input
                id="preferred-time"
                type="time"
                value={formData.preferredTime}
                onChange={(e) =>
                  setFormData({ ...formData, preferredTime: e.target.value })
                }
                data-testid="input-preferred-time"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-urgent"
              checked={formData.isUrgent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isUrgent: checked as boolean })
              }
              data-testid="checkbox-is-urgent"
            />
            <Label htmlFor="is-urgent" className="flex items-center gap-2">
              Mark as Urgent
              {formData.isUrgent && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  3-hour response required
                </span>
              )}
            </Label>
          </div>

          {accessToken && (
            <div className="p-4 bg-muted rounded-md space-y-2" data-testid="div-access-token">
              <Label className="text-sm font-semibold">Your Access Token</Label>
              <p className="text-xs text-muted-foreground">
                Save this token to track and manage your job. You'll need it to access the customer dashboard.
              </p>
              <div className="flex items-center gap-2">
                <Input value={accessToken} readOnly className="font-mono text-xs" data-testid="input-access-token" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(accessToken);
                    toast({ title: "Copied!", description: "Access token copied to clipboard" });
                  }}
                  data-testid="button-copy-token"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            size="lg" 
            disabled={createJobMutation.isPending}
            data-testid="button-submit-request"
          >
            {createJobMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
