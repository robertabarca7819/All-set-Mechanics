import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/Professional_mechanic_using_tablet_a7b814d2.png";

export function Hero() {
  return (
    <section className="min-h-[500px] sm:min-h-[600px] flex items-center bg-gradient-to-b from-primary/5 to-background py-12 sm:py-0">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
              Professional Mobile Mechanics at Your Doorstep
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
              Get your vehicle serviced wherever you are. Connect with certified mechanics who come to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link href="/request">
                <a className="w-full sm:w-auto"><Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">Get Started</Button></a>
              </Link>
              <Link href="#how-it-works">
                <a className="w-full sm:w-auto"><Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">How It Works</Button></a>
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <img 
              src="/attached_assets/generated_images/Professional_mechanic_using_tablet_a7b814d2.png" 
              alt="Professional mechanic" 
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}