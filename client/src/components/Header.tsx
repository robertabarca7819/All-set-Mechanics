import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const isMobile = useIsMobile();

  const NavLinks = () => (
    <>
      <Link href="/request">
        <a className="w-full"><Button variant="ghost" className="w-full justify-start">Request Service</Button></a>
      </Link>
      <Link href="/provider-register">
        <a className="w-full"><Button variant="ghost" className="w-full justify-start">Become a Mechanic</Button></a>
      </Link>
      <Link href="/quick-access">
        <a className="w-full"><Button className="w-full">Quick Access</Button></a>
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        <Link href="/">
          <a className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2" data-testid="link-home">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">All-Set Mechanics</span>
          </a>
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
            <Link href="/">
              <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-home">
                Home
              </a>
            </Link>
            <Link href="/customer-register">
              <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-customer-register">
                Customer Sign Up
              </a>
            </Link>
            <Link href="/customer-login">
              <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-customer-login">
                Customer Login
              </a>
            </Link>
            <Link href="/provider-register">
              <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-provider-register">
                Mechanic Sign Up
              </a>
            </Link>
            <Link href="/provider-login">
              <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-provider-login">
                Mechanic Login
              </a>
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