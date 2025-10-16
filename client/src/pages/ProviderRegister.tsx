import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Header } from "@/components/Header";

export default function ProviderRegister() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; firstName: string; lastName: string; phoneNumber: string }) => {
      const res = await apiRequest("POST", "/api/provider/register", data);
      return res;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/verify"] });
      setEmployeeId(data.employeeId);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Username already exists or invalid data",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      toast({
        title: "First Name Required",
        description: "Please enter your first name",
        variant: "destructive",
      });
      return;
    }

    if (!lastName.trim()) {
      toast({
        title: "Last Name Required",
        description: "Please enter your last name",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({ username, password, firstName, lastName, phoneNumber });
  };

  if (employeeId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Registration Successful!</CardTitle>
              <CardDescription>
                Welcome to All-Set Mechanics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md space-y-2">
                <p className="text-sm font-medium">Your Employee ID is:</p>
                <p className="text-2xl font-bold text-primary" data-testid="text-employee-id">
                  {employeeId}
                </p>
                <p className="text-sm text-muted-foreground">
                  Please save this for future reference.
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => setLocation("/provider-dashboard")}
                data-testid="button-continue"
              >
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mechanic Registration</CardTitle>
            <CardDescription>
              Create an account to start accepting service requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  data-testid="input-last-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone-number">Phone Number</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  data-testid="input-phone-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-confirm-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/provider-login">
                  <a className="text-primary hover:underline" data-testid="link-login">
                    Login here
                  </a>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
