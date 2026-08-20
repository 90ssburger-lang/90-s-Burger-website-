import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm text-slate-600">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const needsCustomerProfile = profile?.role === "customer" &&
    (!profile.full_name?.trim() || !profile.delivery_address?.trim());

  if (needsCustomerProfile && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace state={{ onboarding: true }} />;
  }

  return children ? <>{children}</> : <Outlet />;
}
