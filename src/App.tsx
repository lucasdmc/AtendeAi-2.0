import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { AppProvider } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Clinics from "./pages/Clinics";
import Users from "./pages/Users";
import Appointments from "./pages/Appointments";
import Calendar from "./pages/Calendar";
import Context from "./pages/Context";
import Conversations from "./pages/Conversations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              {/* Auth route outside Layout */}
              <Route path="/auth" element={<Auth />} />
              
              {/* All other routes wrapped in Layout */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/clinics" element={
                        <ProtectedRoute requiredRoles={['admin_lify']}>
                          <Clinics />
                        </ProtectedRoute>
                      } />
                      <Route path="/users" element={
                        <ProtectedRoute requiredRoles={['admin_lify', 'admin_clinic']}>
                          <Users />
                        </ProtectedRoute>
                      } />
                      <Route path="/appointments" element={<Appointments />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/context" element={<Context />} />
                      <Route path="/conversations" element={<Conversations />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
