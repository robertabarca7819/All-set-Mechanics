import { Link } from "wouter";
import { Wrench } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">All-Set Mechanics</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional service booking made simple. Your mechanics, all set.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about">
                  <a className="hover:text-primary transition-colors" data-testid="link-footer-about">
                    About Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/how-it-works">
                  <a className="hover:text-primary transition-colors" data-testid="link-footer-how">
                    How It Works
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:text-primary transition-colors" data-testid="link-footer-contact">
                    Contact
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help">
                  <a className="hover:text-primary transition-colors" data-testid="link-footer-help">
                    Help Center
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <a className="hover:text-primary transition-colors" data-testid="link-footer-faq">
                    FAQ
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/safety">
                  <a className="hover:text-primary transition-colors" data-testid="link-footer-safety">
                    Safety Guidelines
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy">
                  <a className="hover:text-primary transition-colors" data-testid="link-footer-privacy">
                    Privacy Policy
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="hover:text-primary transition-colors" data-testid="link-footer-terms">
                    Terms of Service
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 All-Set Mechanics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
