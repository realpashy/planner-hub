import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "./pages/Dashboard";
import WeeklyPlanner from "./pages/WeeklyPlanner";
import Onboarding from "./pages/Onboarding";
import { isOnboarded } from "./lib/storage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/planner" component={WeeklyPlanner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [onboarded, setOnboarded] = useState(isOnboarded());

  if (!onboarded) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div dir="rtl" className="min-h-screen font-sans bg-background text-foreground">
            <Onboarding onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["planner_data"] });
              setOnboarded(true);
            }} />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

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
