import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Building2, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'broker') return '/broker';
    return '/customer';
  };
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center text-red-600 font-bold text-xl">
                <Building2 className="h-8 w-8 mr-2" />
                <span>PrimeEstate</span>
              </Link>
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <Link to="/properties" className="text-slate-600 hover:text-red-600 font-medium">
                Properties
              </Link>
              
              {!user ? (
                <Link to="/auth" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium transition-colors">
                  Login
                </Link>
              ) : (
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 text-slate-700 hover:text-red-600 focus:outline-none"
                  >
                    <div className="bg-red-100 p-1.5 rounded-full">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <span className="font-medium capitalize">{user.fullName || user.email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50">
                      <Link 
                        to={getDashboardLink()} 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-gray-100"
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center font-bold text-xl mb-4">
              <Building2 className="h-6 w-6 mr-2 text-red-600" />
              <span>PrimeEstate</span>
            </div>
            <p className="text-slate-400">Your trusted partner in finding the perfect property.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/properties" className="hover:text-white">All Properties</Link></li>
              <li><Link to="/auth" className="hover:text-white">Login/Register</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-slate-400">
              <li>123 Real Estate Blvd</li>
              <li>City, State 12345</li>
              <li>contact@primeestate.com</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
