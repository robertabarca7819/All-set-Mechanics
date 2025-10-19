import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TestStripe() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testStripeKeys = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // First check if the frontend key is present
      const frontendKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      
      if (!frontendKey) {
        setError("Frontend Stripe public key (VITE_STRIPE_PUBLIC_KEY) is not configured!");
        setLoading(false);
        return;
      }

      // Check frontend key format
      const isFrontendLive = frontendKey.startsWith('pk_live_');
      const isFrontendTest = frontendKey.startsWith('pk_test_');
      
      if (!isFrontendLive && !isFrontendTest) {
        setError("Frontend Stripe public key has invalid format. It should start with 'pk_live_' or 'pk_test_'");
        setLoading(false);
        return;
      }

      // Test the backend key
      const response = await fetch('/api/test-stripe');
      const data = await response.json();
      
      setTestResult({
        frontend: {
          keyPresent: true,
          keyType: isFrontendLive ? 'live' : 'test',
          keyFormat: 'valid'
        },
        backend: data
      });
    } catch (err: any) {
      setError(err.message || "Failed to test Stripe configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Configuration Test</CardTitle>
          <CardDescription>
            Test if your Stripe API keys are configured correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={testStripeKeys} 
            disabled={loading}
            className="w-full sm:w-auto"
            data-testid="button-test-stripe"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Stripe Configuration...
              </>
            ) : (
              "Test Stripe Keys"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {testResult && (
            <div className="space-y-4">
              {/* Frontend Key Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Frontend Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Public Key Present:</span>
                    {testResult.frontend.keyPresent ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        No
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Key Type:</span>
                    <Badge variant={testResult.frontend.keyType === 'live' ? 'default' : 'secondary'}>
                      {testResult.frontend.keyType?.toUpperCase() || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Key Format:</span>
                    <Badge variant={testResult.frontend.keyFormat === 'valid' ? 'default' : 'destructive'}>
                      {testResult.frontend.keyFormat || 'Unknown'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Backend Key Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Backend Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {testResult.backend.success ? (
                    <>
                      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{testResult.backend.message}</AlertDescription>
                      </Alert>
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Secret Key Present:</span>
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Yes
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Key Type:</span>
                          <Badge variant={testResult.backend.keyType === 'live' ? 'default' : 'secondary'}>
                            {testResult.backend.keyType?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">API Connection:</span>
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {testResult.backend.apiConnection}
                          </Badge>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Configuration Error</AlertTitle>
                        <AlertDescription>{testResult.backend.error}</AlertDescription>
                      </Alert>
                      {testResult.backend.stripeError && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <span className="font-semibold">Stripe Error: </span>
                          {testResult.backend.stripeError}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Key Mismatch Warning */}
              {testResult.frontend.keyType !== testResult.backend?.keyType && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning: Key Type Mismatch</AlertTitle>
                  <AlertDescription>
                    Your frontend is using {testResult.frontend.keyType?.toUpperCase()} keys 
                    while your backend is using {testResult.backend?.keyType?.toUpperCase()} keys. 
                    Make sure both are using the same environment (both test or both live).
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Summary */}
              {testResult.backend?.success && testResult.frontend.keyPresent && 
               testResult.frontend.keyType === testResult.backend?.keyType && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>All Keys Valid!</AlertTitle>
                  <AlertDescription>
                    Your Stripe configuration is correct. Both frontend and backend are using 
                    valid {testResult.backend.keyType?.toUpperCase()} keys and can connect to Stripe successfully.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}