import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Map, 
  List, 
  Plus, 
  User, 
  Bell, 
  LogOut, 
  Home,
  Settings
} from 'lucide-react';
import { Users as UsersIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Map View', href: '/issues/map', icon: Map },
    { name: 'List View', href: '/issues/list', icon: List },
    ...(user?.role === 'admin2' ? [{ name: 'Manage Admins', href: '/admins', icon: UsersIcon }] : []),
    ...(user?.role === 'citizen' ? [{ name: 'Submit Issue', href: '/issues/submit', icon: Plus }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const scrollToNotifications = () => {
    if (location.pathname === '/dashboard') {
      const el = document.getElementById('notifications');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate('/dashboard', { state: { scrollTo: 'notifications' } });
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--soft-gray))]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(var(--forest-green))]">
                  <span className="text-white font-bold text-sm">CR</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Citizen Reports</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative" onClick={scrollToNotifications}>
                <Bell className="h-5 w-5 text-[hsl(var(--forest-green))]" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:block text-[hsl(var(--teal))] font-semibold">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-[hsl(var(--fresh-lime))]/30 text-[hsl(var(--forest-green))]'
                        : 'text-gray-700 hover:bg-[hsl(var(--sand-beige))]/50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Role Badge */}
            <div className="mt-8 p-3 bg-[hsl(var(--soft-gray))] rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role</span>
                <Badge variant={user?.role === 'citizen' ? 'default' : 'secondary'}>
                  {user?.role === 'citizen' ? 'Citizen' : 
                   user?.role === 'admin1' ? 'Admin' : 'Supervisor'}
                </Badge>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

