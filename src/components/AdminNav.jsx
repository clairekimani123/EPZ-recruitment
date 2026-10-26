import { Link, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/auth.js';

export default function AdminNav() {
  const navigate = useNavigate();
  
  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <nav className="my-custom-navbar">
      <span className="nav-wordmark">Peak Campus</span>
      
      <div className="nav-links">
        <Link to="/admin">Applicants</Link>
        <Link to="/admin/batches">Batches</Link>
        <Link to="/admin/companies">Companies</Link>
      </div>

      <button className="nav-logout-btn" onClick={handleLogout}>
        Log out
      </button>
    </nav>
  );
}