import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Job } from "@shared/schema";

export interface AIAssistantAnalysis {
  summary: string;
  recommendedParts: string[];
  estimatedLaborHours: number;
  estimatedCost: number;
  notes: string;
}

interface AIJobAssistantProps {
  job: Job;
  onSave: (analysis: AIAssistantAnalysis) => void;
}

export function AIJobAssistant({ job, onSave }: AIJobAssistantProps) {
  const defaults = useMemo(() => {
    const baseSummary = job.description || job.title;
    const estimatedLabor = job.estimatedPrice ? Math.max(1, Math.round(job.estimatedPrice / 120)) : 2;
    const estimatedCost = job.estimatedPrice ?? estimatedLabor * 120;

    const partsByService: Record<string, string[]> = {
      "Brake Service": ["Brake pads", "Brake rotors", "Brake cleaner"],
      "Oil Change": ["Oil filter", "Engine oil", "Drain plug gasket"],
      "Tire Rotation": ["Torque wrench", "Wheel chocks", "Floor jack"],
    };

    const normalizedService = job.serviceType?.toLowerCase() ?? "";
    const recommendedParts =
      Object.entries(partsByService).find(([service]) => normalizedService.includes(service.toLowerCase()))?.[1] ?? [
        "Protective gloves",
        "Standard tool kit",
      ];

    return {
      summary: `AI summary for ${job.title}: ${baseSummary}`,
      recommendedParts,
      estimatedLaborHours: estimatedLabor,
      estimatedCost,
      notes: "Confirm parts availability and communicate timeline with the customer.",
    } satisfies AIAssistantAnalysis;
  }, [job]);

  const [summary, setSummary] = useState(defaults.summary);
  const [partsText, setPartsText] = useState(defaults.recommendedParts.join("\n"));
  const [estimatedLaborHours, setEstimatedLaborHours] = useState(String(defaults.estimatedLaborHours));
  const [estimatedCost, setEstimatedCost] = useState(String(defaults.estimatedCost));
  const [notes, setNotes] = useState(defaults.notes);

  const handleSave = () => {
    const parts = partsText
      .split(/\r?\n/)
      .map((part) => part.trim())
      .filter(Boolean);

    const analysis: AIAssistantAnalysis = {
      summary,
      recommendedParts: parts,
      estimatedLaborHours: Number(estimatedLaborHours) || 0,
      estimatedCost: Number(estimatedCost) || 0,
      notes,
    };

    onSave(analysis);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Job Overview</h3>
        <p className="text-sm text-muted-foreground">
          {job.title} • {job.serviceType} • {job.location}
        </p>
      </div>

      <Separator />

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="parts">Recommended Parts</Label>
          <Textarea
            id="parts"
            value={partsText}
            onChange={(event) => setPartsText(event.target.value)}
            rows={4}
            placeholder="One item per line"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="laborHours">Estimated Labor Hours</Label>
            <Input
              id="laborHours"
              type="number"
              min={0}
              step={0.5}
              value={estimatedLaborHours}
              onChange={(event) => setEstimatedLaborHours(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
            <Input
              id="estimatedCost"
              type="number"
              min={0}
              step={5}
              value={estimatedCost}
              onChange={(event) => setEstimatedCost(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={handleSave}>
          Save Recommendations
        </Button>
      </div>
    </div>
  );
}
