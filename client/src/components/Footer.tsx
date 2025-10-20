import { Link } from "wouter";
import { Wrench } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-8 sm:py-12">
      <div className="container px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">MobileWrench</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Professional mobile mechanics at your service
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link href="/request" className="text-muted-foreground hover:text-foreground">Request Service</Link></li>
              <li><Link href="/provider-register" className="text-muted-foreground hover:text-foreground">Become a Mechanic</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">support@mobilewrench.com</p>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} MobileWrench. All rights reserved.
        </div>
      </div>
    </footer>
  );
}