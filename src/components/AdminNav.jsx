import { Link, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/auth.js';

export default function AdminNav() {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <nav className="admin-nav">
      <span className="admin-nav-wordmark">Peak Campus</span>
      <Link to="/admin">Applicants</Link>
      <Link to="/admin/batches">Batches</Link>
      <Link to="/admin/companies">Companies</Link>
      <button className="button" style={{ marginLeft: 'auto' }} onClick={handleLogout}>
        Log out
      </button>
    </nav>
  );
}