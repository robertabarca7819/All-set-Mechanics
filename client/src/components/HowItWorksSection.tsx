import { Card } from "@/components/ui/card";
import { ClipboardList, UserCheck, CreditCard } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Submit Your Request",
    description: "Fill out a simple form with your service needs, location, and preferred time slots. No phone calls required.",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Provider Accepts Job",
    description: "Qualified mechanics review your request and accept the job. Get instant notifications when matched.",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Secure Prepayment",
    description: "Complete a prepayment contract with transparent pricing. Start your service with confidence.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get professional mechanical services in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="p-8 hover-elevate transition-all"
                data-testid={`card-step-${index + 1}`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-4xl font-bold text-muted-foreground/20">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
