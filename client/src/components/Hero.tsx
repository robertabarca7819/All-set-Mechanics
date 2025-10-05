import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import heroImage from "@assets/generated_images/Professional_mechanic_using_tablet_a7b814d2.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Book Mechanical Services
                <span className="block text-primary">Without Phone Calls</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                Connect with professional mechanics instantly. Submit job requests, review quotes, and handle secure prepayment contracts—all in one platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="default" data-testid="button-hero-get-started">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" data-testid="button-hero-how-it-works">
                How It Works
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-chart-2 flex-shrink-0" />
                <span className="text-sm">No phone calls needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-chart-2 flex-shrink-0" />
                <span className="text-sm">Secure prepayment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-chart-2 flex-shrink-0" />
                <span className="text-sm">Instant confirmation</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <img
                src={heroImage}
                alt="Professional mechanic using tablet in modern workshop"
                className="w-full h-auto object-cover"
                data-testid="img-hero"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
