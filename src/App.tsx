
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { StoreSettingsProvider } from "@/contexts/StoreSettingsContext";
import { CartProvider } from "@/contexts/CartContext";
import { FinancialProvider } from "@/contexts/FinancialContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ControllerProtectedRoute from "@/components/ControllerProtectedRoute";
import { Suspense, lazy } from "react";
import { StoreProvider } from "@/contexts/StoreSettingsContext";

const Index = lazy(() => import("./pages/Index"));
const Admin = lazy(() => import("./pages/Admin"));
const Controller = lazy(() => import("./pages/Controller"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
    <StoreProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <FinancialProvider>
                <ThemeProvider>
                  <CartProvider>
                    <Suspense fallback={<div style={{padding: 40, textAlign: 'center'}}>Carregando página...</div>}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route
                          path="/admin/*"
                          element={
                            <ProtectedRoute>
                              <StoreSettingsProvider>
                                <Admin />
                              </StoreSettingsProvider>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/controller/*"
                          element={
                            <ProtectedRoute>
                              <ControllerProtectedRoute>
                                <Controller />
                              </ControllerProtectedRoute>
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </CartProvider>
                </ThemeProvider>
              </FinancialProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </StoreProvider>
  );
}

export default App;
