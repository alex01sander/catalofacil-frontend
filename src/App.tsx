
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StoreSettingsProvider } from "@/contexts/StoreSettingsContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DomainProtectedRoute from "@/components/DomainProtectedRoute";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Controller from "./pages/Controller";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('auth')) {
          return false;
        }
        return failureCount < 2;
      }
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <StoreSettingsProvider>
              <ThemeProvider>
                <CartProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route
                      path="/admin/*"
                      element={
                        <ProtectedRoute>
                          <DomainProtectedRoute>
                            <Admin />
                          </DomainProtectedRoute>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/controller/*"
                      element={
                        <ProtectedRoute>
                          <Controller />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </CartProvider>
              </ThemeProvider>
            </StoreSettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
