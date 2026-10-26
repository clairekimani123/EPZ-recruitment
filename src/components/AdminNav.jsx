import { Link, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/auth.js';

export default function AdminNav() {
  const navigate = useNavigate();
  
  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <nav className="bg-blue-600 p-4 mb-6 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
      
      {/* Brand / Wordmark */}
      <span className="text-white font-bold text-xl tracking-wide">
        Peak Campus
      </span>

      {/* Navigation Links - Stacks on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center w-full md:w-auto">
        <Link to="/admin" className="text-white font-semibold hover:text-blue-200 transition-colors">
          Applicants
        </Link>
        <Link to="/admin/batches" className="text-white font-semibold hover:text-blue-200 transition-colors">
          Batches
        </Link>
        <Link to="/admin/companies" className="text-white font-semibold hover:text-blue-200 transition-colors">
          Companies
        </Link>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors w-full md:w-auto"
      >
        Log out
      </button>
      
    </nav>
  );
}