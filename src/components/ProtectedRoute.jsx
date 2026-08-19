import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../lib/auth.js';

// Wraps any page that requires login. This is UX only, not real security —
// the real security is the requireAuth middleware on the server.

export default function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}