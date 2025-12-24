import { Search, Menu, X, LogOut, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut, isAdmin } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top Row - Black Stripe */}
      <div className="bg-black h-12 flex items-center justify-center">
        <img
          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Site%20Icons/logo-top.png`}
          alt="Warehouse"
          className="h-full w-auto object-contain"
        />
      </div>

      {/* Bottom Row - White Stripe */}
      <div className="bg-white h-20">
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-center h-full relative">
            {/* Navigation - Left */}
            <nav className="hidden md:flex items-center gap-6 absolute left-4">
              <a href="/" className="text-xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition">
                HOME
              </a>
              <a href="/shop" className="text-xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition">
                SHOP
              </a>
              <a href="/about" className="text-xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition">
                ABOUT
              </a>
              {isAdmin && (
                <a href="/admin" className="text-xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition">
                  ADMIN
                </a>
              )}
            </nav>

            {/* Center: 414 Logo */}
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Site%20Icons/logo-bottom.png`}
              alt="414"
              className="h-12 w-auto object-contain"
            />

            {/* Right: Search Bar and Auth */}
            <div className="hidden md:flex items-center gap-2 absolute right-4">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition w-64"
                />
                <button type="submit" className="p-2 bg-black text-white hover:bg-gray-800 transition">
                  <Search className="w-5 h-5" />
                </button>
              </form>
              {user ? (
                <button
                  onClick={signOut}
                  className="p-2 bg-black text-white hover:bg-gray-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="p-2 bg-black text-white hover:bg-gray-800 transition"
                  title="Sign In"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 absolute right-4"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="bg-black h-12 flex items-center justify-center px-4 relative">
              <img
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Site%20Icons/logo-top.png`}
                alt="Warehouse"
                className="h-full w-auto object-contain"
              />
              <button onClick={() => setIsMenuOpen(false)} className="text-white p-2 absolute right-4">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 flex flex-col p-8 space-y-8">
              <nav className="flex flex-col space-y-6">
                <a
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition"
                >
                  HOME
                </a>
                <a
                  href="/shop"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition"
                >
                  SHOP
                </a>
                <a
                  href="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition"
                >
                  ABOUT
                </a>
                {isAdmin && (
                  <a
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-4xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition"
                  >
                    ADMIN
                  </a>
                )}
                {user ? (
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-4xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition text-left"
                  >
                    SIGN OUT
                  </button>
                ) : (
                  <a
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-4xl font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide hover:text-gray-600 transition"
                  >
                    SIGN IN
                  </a>
                )}
              </nav>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex flex-col gap-4 mt-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:outline-none focus:border-black transition text-lg"
                />
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-black text-white hover:bg-gray-800 transition text-lg font-['Agency_FB','Bebas_Neue',sans-serif] tracking-wide"
                >
                  SEARCH
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
