import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Settings from "@/pages/settings";
import Subscription from "@/pages/subscription";
import PublicMenu from "@/pages/public-menu";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {user && <Navbar />}
      <Switch>
        <Route path="/" component={user ? Dashboard : Login} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={user ? Dashboard : Login} />
        <Route path="/products" component={user ? Products : Login} />
        <Route path="/settings" component={user ? Settings : Login} />
        <Route path="/subscription" component={user ? Subscription : Login} />
        <Route path="/menu/:slug" component={PublicMenu} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
