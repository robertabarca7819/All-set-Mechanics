import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Wrench } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2" data-testid="link-home">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">All-Set Mechanics</span>
        </Link>

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

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
