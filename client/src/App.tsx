import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import RequestPage from "@/pages/RequestPage";
import AdminPage from "@/pages/AdminPage";
import AdminCalendar from "@/pages/AdminCalendar";
import CustomerDashboard from "@/pages/CustomerDashboard";
import ContractPage from "@/pages/ContractPage";
import JobDetailsPage from "@/pages/JobDetailsPage";
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderRegister from "@/pages/ProviderRegister";
import ProviderLogin from "@/pages/ProviderLogin";
import CustomerRegister from "@/pages/CustomerRegister";
import CustomerLogin from "@/pages/CustomerLogin";
import QuickAccess from "@/pages/QuickAccess";
import Messages from "@/pages/Messages";
import TestStripe from "@/pages/TestStripe";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/request" component={RequestPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/calendar" component={AdminCalendar} />
      <Route path="/my-jobs" component={CustomerDashboard} />
      <Route path="/contract/:jobId" component={ContractPage} />
      <Route path="/job/:jobId" component={JobDetailsPage} />
      <Route path="/provider-register" component={ProviderRegister} />
      <Route path="/provider-login" component={ProviderLogin} />
      <Route path="/customer-register" component={CustomerRegister} />
      <Route path="/customer-login" component={CustomerLogin} />
      <Route path="/quick-access" component={QuickAccess} />
      <Route path="/provider-dashboard" component={ProviderDashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/test-stripe" component={TestStripe} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
