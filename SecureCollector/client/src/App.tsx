import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Dashboard from "@/pages/dashboard";
import StaffRecords from "@/pages/staff-records";
import AddStaff from "@/pages/add-staff";
import StaffProfile from "@/pages/staff-profile";
import VerifyStaff from "@/pages/verify-staff";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/staff-records" component={StaffRecords} />
      <Route path="/staff-profile/:id" component={StaffProfile} />
      <Route path="/verify/:id" component={VerifyStaff} />
      <Route path="/admin" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/add-staff" component={() => <ProtectedRoute component={AddStaff} />} />
      <Route path="/departments" component={() => <ProtectedRoute component={() => <div className="p-8">Departments page coming soon</div>} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={() => <div className="p-8">Reports page coming soon</div>} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={() => <div className="p-8">Settings page coming soon</div>} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppWrapper />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppWrapper() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated or on access choice page - show without layout
  if (!isAuthenticated || location === "/") {
    return <Router />;
  }

  // Authenticated - show with layout
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main>
          <Router />
        </main>
      </div>
    </div>
  );
}

export default App;
