import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { SavedCarsProvider } from "@/contexts/SavedCarsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CountryProvider } from "@/contexts/CountryContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieConsent from "@/components/CookieConsent";
import BugReportButton from "@/components/BugReportButton";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OnboardingTour from "@/components/OnboardingTour";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import CarDetail from "./pages/CarDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DealerPricing from "./pages/DealerPricing";
import DealerDashboard from "./pages/DealerDashboard";
import DealerLanding from "./pages/DealerLanding";
import AdminDashboard from "./pages/AdminDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AgentOnboard from "./pages/AgentOnboard";
import CreateListing from "./pages/CreateListing";
import SavedCars from "./pages/SavedCars";
import Inbox from "./pages/Inbox";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import HelpCentre from "./pages/HelpCentre";
import ProtectedRoute from "./components/ProtectedRoute";
import CompareCars from "./pages/CompareCars";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import BlogPost from "./pages/BlogPost";
import CarValuation from "./pages/CarValuation";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CountryProvider>
              <AuthProvider>
                <SavedCarsProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/car/:id" element={<CarDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/dealers" element={<DealerPricing />} />
                    <Route path="/dealer/:slug" element={<DealerLanding />} />
                    <Route path="/saved" element={<SavedCars />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/help" element={<HelpCentre />} />
                    <Route path="/compare" element={<CompareCars />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:id" element={<BlogPost />} />
                    <Route path="/valuation" element={<CarValuation />} />
                    <Route
                      path="/inbox"
                      element={
                        <ProtectedRoute>
                          <Inbox />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DealerDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/listings/new"
                      element={
                        <ProtectedRoute>
                          <CreateListing />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/listings/edit"
                      element={
                        <ProtectedRoute>
                          <CreateListing />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/sell"
                      element={
                        <ProtectedRoute>
                          <CreateListing />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/agent"
                      element={
                        <ProtectedRoute requiredRole="agent">
                          <AgentDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/agent/onboard"
                      element={
                        <ProtectedRoute requiredRole="agent">
                          <AgentOnboard />
                        </ProtectedRoute>
                      }
                    />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <CookieConsent />
                  <BugReportButton />
                </SavedCarsProvider>
              </AuthProvider>
              </CountryProvider>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
