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
import MealPlanner from "./pages/MealPlanner";
import MealPlannerSetup from "./pages/MealPlannerSetup";
import CashflowPlanner from "./pages/CashflowPlanner";
import HabitsTracker from "./pages/HabitsTracker";
import AuthPage from "./pages/AuthPage";
import SettingsPage from "./pages/SettingsPage";
import { AuthProvider, useAuth } from "./lib/auth";
import { pullCloudToLocal, pushLocalToCloud } from "./lib/cloud-sync";
import { AppShell } from "@/components/layout/AppShell";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}

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

  const AuthAwareDashboard = auth.user ? Dashboard : AuthPage;
  const AuthAwareWeekly = auth.user ? WeeklyPlanner : AuthPage;
  const AuthAwareBudget = auth.user ? BudgetPlanner : AuthPage;
  const AuthAwareMeal = auth.user ? MealPlanner : AuthPage;
  const AuthAwareMealSetup = auth.user ? MealPlannerSetup : AuthPage;
  const AuthAwareCashflow = auth.user ? CashflowPlanner : AuthPage;
  const AuthAwareHabits = auth.user ? HabitsTracker : AuthPage;
  const AuthAwareSettings = auth.user ? SettingsPage : AuthPage;

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={auth.user ? (() => <ProtectedRoute component={Dashboard} />) : AuthAwareDashboard} />
      <Route path="/cashflow" component={auth.user ? (() => <ProtectedRoute component={CashflowPlanner} />) : AuthAwareCashflow} />
      <Route path="/habits" component={auth.user ? (() => <ProtectedRoute component={HabitsTracker} />) : AuthAwareHabits} />
      <Route path="/weekly-planner" component={auth.user ? (() => <ProtectedRoute component={WeeklyPlanner} />) : AuthAwareWeekly} />
      <Route path="/weekly-planner/" component={auth.user ? (() => <ProtectedRoute component={WeeklyPlanner} />) : AuthAwareWeekly} />
      <Route path="/planner/weekly-planner" component={auth.user ? (() => <ProtectedRoute component={WeeklyPlanner} />) : AuthAwareWeekly} />
      <Route path="/planner/weekly-planner/" component={auth.user ? (() => <ProtectedRoute component={WeeklyPlanner} />) : AuthAwareWeekly} />
      <Route path="/planner/setup" component={auth.user ? (() => <ProtectedRoute component={WeeklyPlanner} />) : AuthAwareWeekly} />
      <Route path="/planner/setup/" component={auth.user ? (() => <ProtectedRoute component={WeeklyPlanner} />) : AuthAwareWeekly} />
      <Route path="/planner" component={auth.user ? (() => <ProtectedRoute component={WeeklyPlanner} />) : AuthAwareWeekly} />
      <Route path="/budget" component={auth.user ? (() => <ProtectedRoute component={BudgetPlanner} />) : AuthAwareBudget} />
      <Route path="/meal/setup" component={auth.user ? (() => <ProtectedRoute component={MealPlannerSetup} />) : AuthAwareMealSetup} />
      <Route path="/meal/setup/" component={auth.user ? (() => <ProtectedRoute component={MealPlannerSetup} />) : AuthAwareMealSetup} />
      <Route path="/meal" component={auth.user ? (() => <ProtectedRoute component={MealPlanner} />) : AuthAwareMeal} />
      <Route path="/settings" component={auth.user ? (() => <ProtectedRoute component={SettingsPage} />) : AuthAwareSettings} />
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
