import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserPlus, 
  LogIn, 
  Wrench, 
  Users, 
  Shield, 
  Clock,
  BadgeCheck,
  DollarSign,
  Calendar,
  ChevronRight
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section with Company Name and Tagline */}
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                All-Set Mechanics
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Connecting customers with trusted mechanics for reliable, professional service
              </p>
            </div>

            {/* Login/Signup Options */}
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Customer Section */}
              <Card className="hover-elevate">
                <CardHeader className="space-y-1 pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">For Customers</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Get your vehicle serviced by verified professionals. Quick quotes, transparent pricing, and quality guaranteed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Benefits */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <BadgeCheck className="h-5 w-5 text-primary mt-0.5" />
                      <span className="text-sm">Verified and insured mechanics</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <span className="text-sm">Fast response times and flexible scheduling</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <span className="text-sm">Secure payment and service guarantee</span>
                    </div>
                  </div>

                  {/* Customer Action Buttons */}
                  <div className="space-y-3">
                    <Link href="/customer-register" className="block">
                      <Button className="w-full" size="lg" data-testid="button-customer-signup">
                        <UserPlus className="h-5 w-5" />
                        Sign Up as Customer
                      </Button>
                    </Link>
                    <Link href="/customer-login" className="block">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="lg"
                        data-testid="button-customer-login"
                      >
                        <LogIn className="h-5 w-5" />
                        Customer Log In
                      </Button>
                    </Link>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    <Link href="/api/login" className="block">
                      <Button 
                        variant="secondary" 
                        className="w-full" 
                        size="lg"
                        data-testid="button-google-signin"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Sign in with Google
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Mechanic Section */}
              <Card className="hover-elevate">
                <CardHeader className="space-y-1 pb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">For Mechanics</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Join our network of professional mechanics. Grow your business with steady work and easy job management.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Benefits */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <span className="text-sm">Manage your schedule and choose your jobs</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                      <span className="text-sm">Competitive rates and quick payments</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <BadgeCheck className="h-5 w-5 text-primary mt-0.5" />
                      <span className="text-sm">Employee ID tracking for shop verification</span>
                    </div>
                  </div>

                  {/* Mechanic Action Buttons */}
                  <div className="space-y-3">
                    <Link href="/provider-register" className="block">
                      <Button className="w-full" size="lg" data-testid="button-mechanic-signup">
                        <UserPlus className="h-5 w-5" />
                        Mechanic Sign Up
                      </Button>
                    </Link>
                    <Link href="/provider-login" className="block">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="lg"
                        data-testid="button-mechanic-login"
                      >
                        <LogIn className="h-5 w-5" />
                        Mechanic Login
                      </Button>
                    </Link>
                  </div>

                  {/* Additional Info for Mechanics */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> During registration, you'll need to provide your shop's employee ID for verification. This ensures all mechanics on our platform are legitimate professionals.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Access Link */}
            <div className="mt-12 text-center">
              <Link href="/request">
                <Button variant="ghost" size="lg" className="group" data-testid="button-quick-request">
                  Need immediate service? Submit a quick request
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Call to Action Section */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Experience Better Auto Service?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Whether you're a customer looking for reliable service or a mechanic ready to grow your business, we're here to connect you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/customer-register">
                  <Button size="lg" className="min-w-[200px]" data-testid="button-cta-customer">
                    Get Started as Customer
                  </Button>
                </Link>
                <Link href="/provider-register">
                  <Button size="lg" variant="outline" className="min-w-[200px]" data-testid="button-cta-mechanic">
                    Join as Mechanic
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
