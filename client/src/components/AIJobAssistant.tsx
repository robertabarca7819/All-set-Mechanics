import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, 
  Loader2, 
  DollarSign, 
  Clock, 
  Wrench
} from "lucide-react";
import type { Job } from "@shared/schema";

interface AIJobAssistantProps {
  job?: Job;
  onSave?: (data: AIAnalysisResult) => void;
}

interface AIAnalysisResult {
  jobDescription: string;
  estimatedCost: {
    parts: number;
    labor: number;
    total: number;
    breakdown: string;
  };
  laborTimeHours: number;
  procedureSteps: string[];
  requiredTools: string[];
  requiredParts: string[];
  safetyNotes: string[];
}

export function AIJobAssistant({ job, onSave }: AIJobAssistantProps) {
  const { toast } = useToast();
  const [vehicleInfo, setVehicleInfo] = useState({
    year: "",
    make: "",
    model: "",
    serviceType: job?.serviceType || ""
  });
  const [customerDescription, setCustomerDescription] = useState(job?.description || "");
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (): Promise<AIAnalysisResult> => {
      const response = await apiRequest("POST", "/api/ai/analyze-job", {
        vehicleInfo,
        customerDescription,
        jobType: vehicleInfo.serviceType
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast({
        title: "AI Analysis Complete",
        description: "Review the generated pricing and job details below"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Unable to generate AI recommendations. Please try again."
      });
    }
  });

  const handleAnalyze = () => {
    if (!vehicleInfo.year || !vehicleInfo.make || !vehicleInfo.model) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide vehicle year, make, and model"
      });
      return;
    }
    analyzeMutation.mutate();
  };

  const handleSave = () => {
    if (analysis && onSave) {
      onSave(analysis);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Vehicle Information
          </CardTitle>
          <CardDescription>
            Enter vehicle details to get AI-powered job analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                placeholder="2020"
                value={vehicleInfo.year}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
                data-testid="input-vehicle-year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                placeholder="Toyota"
                value={vehicleInfo.make}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                data-testid="input-vehicle-make"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="Camry"
                value={vehicleInfo.model}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                data-testid="input-vehicle-model"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Customer Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue..."
              value={customerDescription}
              onChange={(e) => setCustomerDescription(e.target.value)}
              rows={3}
              data-testid="input-customer-description"
            />
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="w-full"
            data-testid="button-analyze-with-ai"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Generated Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{analysis.jobDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Labor Cost</p>
                  <p className="text-2xl font-bold" data-testid="text-labor-cost">
                    ${analysis.estimatedCost.labor.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Parts Cost</p>
                  <p className="text-2xl font-bold" data-testid="text-parts-cost">
                    ${analysis.estimatedCost.parts.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">Total Estimate</p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-total-cost">
                    ${analysis.estimatedCost.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {analysis.estimatedCost.breakdown && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Cost Details</p>
                  <p className="text-sm text-muted-foreground">{analysis.estimatedCost.breakdown}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Labor Time Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-labor-hours">
                {analysis.laborTimeHours} hours
              </p>
            </CardContent>
          </Card>

          {analysis.requiredParts && analysis.requiredParts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Parts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.requiredParts.map((part, index) => (
                    <li key={index} className="text-sm">{part}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {analysis.procedureSteps && analysis.procedureSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Procedure Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  {analysis.procedureSteps.map((step, index) => (
                    <li key={index} className="text-sm">{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {onSave && (
            <Button onClick={handleSave} className="w-full" data-testid="button-save-analysis">
              Save Analysis to Job
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
