import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "./pages/Dashboard";
import WeeklyPlanner from "./pages/WeeklyPlanner";
import BudgetPlanner from "./pages/BudgetPlanner";
import AuthPage from "./pages/AuthPage";
import { AuthProvider, useAuth } from "./lib/auth";
import { pullCloudToLocal, pushLocalToCloud } from "./lib/cloud-sync";

function Router() {
  const [, setLocation] = useLocation();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      setLocation("/auth");
    }
  }, [auth.loading, auth.user, setLocation]);

  useEffect(() => {
    if (!auth.user) return;

    let active = true;
    const flushSync = () => {
      pushLocalToCloud().catch(() => null);
    };

    pullCloudToLocal().then(() => {
      if (active) {
        queryClient.invalidateQueries({ queryKey: ["planner_data"] });
      }
    });

    const timer = setInterval(flushSync, 12000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSync();
      }
    };

    const onPageHide = () => {
      flushSync();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      flushSync();
    };
  }, [auth.user]);

  if (auth.loading) return null;

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      {auth.user && <Route path="/" component={Dashboard} />}
      {auth.user && <Route path="/planner/weekly-planner" component={WeeklyPlanner} />}
      {auth.user && <Route path="/planner" component={WeeklyPlanner} />}
      {auth.user && <Route path="/budget" component={BudgetPlanner} />}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div dir="rtl" className="min-h-screen font-sans bg-background text-foreground">
            <Router />
          </div>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
