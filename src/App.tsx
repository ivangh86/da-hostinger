import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useRoutes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { routes } from "./routes";
import LoadingSpinner from "./components/ui/loading-spinner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      refetchOnReconnect: false,
      refetchOnMount: false
    }
  }
});

const AppRoutes = () => {
  const element = useRoutes(routes);
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    }>
      {element}
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <AppRoutes />
          <Toaster />
          <Sonner richColors position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
