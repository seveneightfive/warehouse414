import { Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top Row - Black Stripe */}
      <div className="bg-black h-12 flex items-center">
        <div className="container mx-auto px-4">
          <a href="/" className="block h-10 w-32 overflow-hidden">
            <img
              src="/warehouse414-logo-260.jpg"
              alt="Warehouse"
              className="w-full object-cover object-top"
              style={{ height: '80px', marginTop: '0' }}
            />
          </a>
        </div>
      </div>

      {/* Bottom Row - White Stripe */}
      <div className="bg-white h-18">
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Left: 414 Brand + Navigation */}
            <div className="flex items-center gap-8">
              <a href="/" className="block h-16 w-32 overflow-hidden">
                <img
                  src="/warehouse414-logo-260.jpg"
                  alt="414"
                  className="w-full object-cover object-bottom"
                  style={{ height: '160px', marginTop: '-80px' }}
                />
              </a>

              <nav className="hidden md:flex items-center gap-6">
                <a href="/" className="text-xl font-['Teko'] tracking-wide hover:text-gray-600 transition">
                  HOME
                </a>
                <a href="/shop" className="text-xl font-['Teko'] tracking-wide hover:text-gray-600 transition">
                  SHOP
                </a>
                <a href="/about" className="text-xl font-['Teko'] tracking-wide hover:text-gray-600 transition">
                  ABOUT
                </a>
                <a href="/admin" className="text-xl font-['Teko'] tracking-wide hover:text-gray-600 transition">
                  ADMIN
                </a>
              </nav>
            </div>

            {/* Right: Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
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
            <div className="bg-black h-12 flex items-center justify-between px-4">
              <div className="block h-10 w-32 overflow-hidden">
                <img
                  src="/warehouse414-logo-260.jpg"
                  alt="Warehouse"
                  className="w-full object-cover object-top"
                  style={{ height: '80px', marginTop: '0' }}
                />
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-1 flex flex-col p-8 space-y-8">
              <nav className="flex flex-col space-y-6">
                <a
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-['Teko'] tracking-wide hover:text-gray-600 transition"
                >
                  HOME
                </a>
                <a
                  href="/shop"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-['Teko'] tracking-wide hover:text-gray-600 transition"
                >
                  SHOP
                </a>
                <a
                  href="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-['Teko'] tracking-wide hover:text-gray-600 transition"
                >
                  ABOUT
                </a>
                <a
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-['Teko'] tracking-wide hover:text-gray-600 transition"
                >
                  ADMIN
                </a>
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
                  className="w-full px-6 py-3 bg-black text-white hover:bg-gray-800 transition text-lg font-['Teko'] tracking-wide"
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
