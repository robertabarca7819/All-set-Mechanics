import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorksSection />
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Submit your service request and connect with qualified mechanics instantly
              </p>
              <Link href="/request">
                <Button size="lg" className="text-lg px-8" data-testid="button-get-started">
                  Request a Service
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
