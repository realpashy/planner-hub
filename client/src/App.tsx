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
import Onboarding from "./pages/Onboarding";
import { isOnboarded } from "./lib/storage";

function PlannerSetupRoute() {
  const [, setLocation] = useLocation();

  return (
    <Onboarding
      onComplete={() => {
        queryClient.invalidateQueries({ queryKey: ["planner_data"] });
        setLocation("/planner");
      }}
    />
  );
}

function PlannerRoute() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isOnboarded()) {
      setLocation("/planner/setup");
    }
  }, [setLocation]);

  if (!isOnboarded()) {
    return null;
  }

  return <WeeklyPlanner />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/planner/setup" component={PlannerSetupRoute} />
      <Route path="/planner" component={PlannerRoute} />
      <Route path="/budget" component={BudgetPlanner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div dir="rtl" className="min-h-screen font-sans bg-background text-foreground">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
