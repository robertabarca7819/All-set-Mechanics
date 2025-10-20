import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Wrench } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const isMobile = useIsMobile();

  const NavLinks = () => (
    <>
      <Link href="/request" className="w-full">
        <Button variant="ghost" className="w-full justify-start" data-testid="button-nav-request">Request Service</Button>
      </Link>
      <Link href="/provider-register" className="w-full">
        <Button variant="ghost" className="w-full justify-start" data-testid="button-nav-provider-register">Become a Mechanic</Button>
      </Link>
      <Link href="/quick-access" className="w-full">
        <Button className="w-full" data-testid="button-nav-quick-access">Quick Access</Button>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2" data-testid="link-home">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">All-Set Mechanics</span>
        </Link>

        {isMobile ? (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  <NavLinks />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-home">
              Home
            </Link>
            <Link href="/customer-register" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-customer-register">
              Customer Sign Up
            </Link>
            <Link href="/customer-login" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-customer-login">
              Customer Login
            </Link>
            <Link href="/provider-register" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-provider-register">
              Mechanic Sign Up
            </Link>
            <Link href="/provider-login" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-provider-login">
              Mechanic Login
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {!isMobile && <ThemeToggle />}
        </div>
      </div>
    </header>
  );
}