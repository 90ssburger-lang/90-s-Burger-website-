import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AnalyticsSessionTracker } from "@/components/AnalyticsSessionTracker";
import { AuthProvider as SupabaseAuthProvider } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/auth/ProtectedRoute";

// User pages
import HomePage from "./pages/HomePage";
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderInvoicePage = lazy(() => import("./pages/OrderInvoicePage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminOrderDetailsPage = lazy(() => import("./pages/admin/AdminOrderDetailsPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminCouponsPage = lazy(() => import("./pages/admin/AdminCouponsPage"));
const AdminCouponDetailsPage = lazy(() => import("./pages/admin/AdminCouponDetailsPage"));
const AdminDeliveryZonesPage = lazy(() => import("./pages/admin/AdminDeliveryZonesPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const AdminCustomersPage = lazy(() => import("./pages/admin/AdminCustomersPage"));
const AdminCreateOrderPage = lazy(() => import("./pages/admin/AdminCreateOrderPage"));

const queryClient = new QueryClient();

function HomeRouteGate() {
  return <HomePage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnalyticsSessionTracker />
                <ScrollToTop />
                <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>}><Routes>
                  {/* User Routes */}
                  <Route path="/" element={<HomeRouteGate />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:slug" element={<ProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/payment-result" element={<PaymentResultPage />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/auth" element={<Navigate to="/login" replace />} />
                  <Route path="/auth/callback" element={<Navigate to="/" replace />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <OrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order/:id"
                    element={
                      <ProtectedRoute>
                        <OrderInvoicePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                  <Route path="/admin/customers" element={<AdminCustomersPage />} />
                  <Route path="/admin/orders/new" element={<AdminCreateOrderPage />} />
                  <Route path="/admin/products" element={<AdminProductsPage />} />
                  <Route path="/admin/orders" element={<AdminOrdersPage />} />
                  <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
                  <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                  <Route path="/admin/coupons" element={<AdminCouponsPage />} />
                  <Route path="/admin/coupons/:id" element={<AdminCouponDetailsPage />} />
                  <Route path="/admin/delivery-zones" element={<AdminDeliveryZonesPage />} />

                  <Route path="*" element={<NotFound />} />
                </Routes></Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </FavoritesProvider>
        </CartProvider>
    </SupabaseAuthProvider>
  </QueryClientProvider>
);

export default App;
