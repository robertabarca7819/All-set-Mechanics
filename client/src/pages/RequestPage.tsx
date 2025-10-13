import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Checkbox } from "@/components/ui/checkbox";
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

export default function RequestPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceType || !formData.title || !formData.description || 
        !formData.location || !formData.preferredDate || !formData.preferredTime || !formData.customerEmail) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const appointmentDateTime = new Date(`${formData.preferredDate}T${formData.preferredTime}:00Z`);
      const responseDeadline = formData.isUrgent 
        ? new Date(Date.now() + 3 * 60 * 60 * 1000)
        : null;

      await apiRequest("POST", "/api/jobs", {
        ...formData,
        isUrgent: formData.isUrgent ? "true" : "false",
        responseDeadline,
        appointmentDateTime,
      });
      
      toast({
        title: "Request Submitted!",
        description: "We'll notify you when a provider accepts your job.",
      });
      
      setLocation("/");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit job request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-3xl md:text-4xl font-bold">Request a Service</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fill out the form below and get matched with qualified mechanics
            </p>
          </div>

          <Card className="max-w-2xl mx-auto" data-testid="card-job-request-form">
            <CardHeader>
              <CardTitle className="text-2xl">Service Details</CardTitle>
              <CardDescription>
                Provide information about your vehicle service needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="service-type">Service Type *</Label>
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
                  <Label htmlFor="title">Job Title *</Label>
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
                  <Label htmlFor="description">Description *</Label>
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
                  <Label htmlFor="location">Location *</Label>
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred-date">Preferred Date *</Label>
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
                    <Label htmlFor="preferred-time">Preferred Time *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="customer-email">Your Email Address *</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, customerEmail: e.target.value })
                    }
                    data-testid="input-customer-email"
                  />
                  <p className="text-sm text-muted-foreground">
                    We'll send updates about your service request to this email
                  </p>
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  data-testid="button-submit-request"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
