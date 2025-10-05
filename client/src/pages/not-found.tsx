import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <FileQuestion className="h-24 w-24 mx-auto text-muted-foreground opacity-50" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-xl text-muted-foreground">Page not found</p>
        </div>
        <Link href="/">
          <Button data-testid="button-back-home">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
