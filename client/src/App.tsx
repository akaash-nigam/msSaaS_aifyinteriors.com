import { Route, Switch, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Visualizer } from "./pages/Visualizer";
import { MyDesigns } from "./pages/MyDesigns";
import { Pricing } from "./pages/Pricing";
import { Sparkles, Home as HomeIcon, Image, CreditCard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const isActive = (path: string) => {
    return location === path || location.startsWith(path + "/");
  };

  const navLinks = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/visualizer", label: "Create Design", icon: Sparkles, protected: true },
    { href: "/my-designs", label: "My Designs", icon: Image, protected: true },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 font-bold text-xl text-gray-900 hover:text-blue-600 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              AIfy Interiors
            </a>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              if (link.protected && !user) return null;

              return (
                <Link key={link.href} href={link.href}>
                  <a
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </a>
                </Link>
              );
            })}

            {/* Auth buttons */}
            {user ? (
              <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
                <div className="text-sm text-gray-700">
                  {user.displayName || user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login">
                <a className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all">
                  Sign In
                </a>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {navLinks.map((link) => {
                if (link.protected && !user) return null;

                return (
                  <Link key={link.href} href={link.href}>
                    <a
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                        isActive(link.href)
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </a>
                  </Link>
                );
              })}

              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-200 mt-2 pt-4">
                    {user.displayName || user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login">
                  <a
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg"
                  >
                    Sign In
                  </a>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/pricing" component={Pricing} />

        <Route path="/visualizer">
          <ProtectedRoute>
            <Visualizer />
          </ProtectedRoute>
        </Route>

        <Route path="/my-designs">
          <ProtectedRoute>
            <MyDesigns />
          </ProtectedRoute>
        </Route>

        {/* 404 */}
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-6">Page not found</p>
              <Link href="/">
                <a className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Go Home
                </a>
              </Link>
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}
