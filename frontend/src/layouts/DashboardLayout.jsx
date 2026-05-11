import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Users, 
  FileText, 
  LayoutDashboard, 
  Wallet,
  Building,
  Search,
  Bell,
  LogOut,
  User,
  CheckSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const role = user?.role || "customer";

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = {
    customer: [
      { name: "My Dashboard", path: "/customer", icon: Home },
    ],
    broker: [
      { name: "Dashboard", path: "/broker", icon: LayoutDashboard },
      { name: "Lead Management", path: "/broker/leads", icon: Users },
      { name: "Create Transaction", path: "/broker/transaction", icon: FileText },
    ],
    admin: [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { name: "Property Management", path: "/admin/properties", icon: Building },
      { name: "Duyệt BĐS", path: "/admin/approval", icon: CheckSquare },
      { name: "Financial Management", path: "/admin/finance", icon: Wallet },
    ]
  };

  const currentNav = navItems[role] || [];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex-shrink-0 fixed h-full z-40">
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <Building className="h-8 w-8 text-red-500 mr-2" />
          <span className="font-bold text-xl">PrimeEstate</span>
        </div>
        <nav className="p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            {role} Portal
          </div>
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-red-600 text-white" 
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 w-96">
            <Search className="h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none focus:outline-none focus:ring-0 ml-2 w-full text-sm text-slate-800"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-slate-600 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-600 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center space-x-2 border-l pl-4 border-gray-200">
              <div className="bg-red-100 p-1.5 rounded-full">
                <User className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 capitalize">{user?.fullName || user?.email || role}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
