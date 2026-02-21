import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "teacher" | "student";
}

const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  const pendingRole = allowedRole && !role;
  if (loading && (!user || pendingRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
