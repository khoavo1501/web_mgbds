import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - loading:', loading, 'user:', user, 'allowedRoles:', allowedRoles);

  // Đợi load user từ localStorage
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // If role doesn't match, redirect to homepage or appropriate dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute - Role mismatch, user.role:', user.role, 'allowedRoles:', allowedRoles);
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute - Access granted');
  return <Outlet />;
}
