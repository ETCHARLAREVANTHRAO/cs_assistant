import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUserAdmin } from '../utils/admin';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="font-label-md text-label-md text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isUserAdmin(currentUser.email)) {
    // Normal users attempting to access /admin routes are redirected to /chat
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
}
