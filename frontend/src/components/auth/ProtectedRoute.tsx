import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  adminOnly = false, 
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin access if required
  if (adminOnly === true && user?.userType !== 'Administrator') {
    return <Navigate to="/reports" replace />;
  }

  // Check for allowed roles if specified
  if (allowedRoles.length > 0 && user?.userType && !allowedRoles.includes(user.userType)) {
    return <Navigate to="/reports" replace />;
  }

  // Redirect regular users to reports page if they try to access unauthorized pages
  if (user?.userType === 'user' && 
      !["/reports", "/print"].includes(location.pathname)) {
    return <Navigate to="/reports" replace />;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
} 