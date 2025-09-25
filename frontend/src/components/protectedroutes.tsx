import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/authcontext";
import { JSX } from "react";

interface ProtectedRouteProps {
  children: JSX.Element;
  roles?: string[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />; // ou page d'erreur
  }

  return children;
};
