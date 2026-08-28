import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../lib/auth.js';

// Wraps any page that requires login. If there's no token stored, redirect
// to /login instead of rendering the protected page at all.
//
// IMPORTANT CAVEAT: this only hides the page in the browser. It is NOT real
// security by itself - someone could still call the API directly with
// curl. The actual security is the `requireAuth` middleware on the server.
// This component exists purely for user experience, not as a security
// boundary.

export default function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}