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
import PageSkeleton from "@/components/PageSkeleton";
import ScrollToTop from "@/components/ScrollToTop";
import BackToTopButton from "@/components/BackToTopButton";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded routes
const Index = lazy(() => import("./pages/Index"));
const Browse = lazy(() => import("./pages/Browse"));
const CarDetail = lazy(() => import("./pages/CarDetail"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DealerPricing = lazy(() => import("./pages/DealerPricing"));
const DealerDashboard = lazy(() => import("./pages/DealerDashboard"));
const DealerLanding = lazy(() => import("./pages/DealerLanding"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const AgentOnboard = lazy(() => import("./pages/AgentOnboard"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const SavedCars = lazy(() => import("./pages/SavedCars"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Profile = lazy(() => import("./pages/Profile"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));
const HelpCentre = lazy(() => import("./pages/HelpCentre"));
const CompareCars = lazy(() => import("./pages/CompareCars"));
const Blog = lazy(() => import("./pages/Blog"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const CarValuation = lazy(() => import("./pages/CarValuation"));

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
                  <ScrollToTop />
                  <Suspense fallback={<PageSkeleton />}>
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
                  </Suspense>
                  <CookieConsent />
                  <BugReportButton />
                  <PWAInstallPrompt />
                  <OnboardingTour />
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
