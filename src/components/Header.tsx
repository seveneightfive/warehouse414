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
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="bg-black text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-['Kabel'] tracking-wide">
            unique, one-of-a-kind high style furnishings
          </p>
        </div>
      </div>

      <div className="relative bg-white">
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-20">
          <a href="/">
            <img
              src="/warehouse414-logo-260.jpg"
              alt="Warehouse 414"
              className="h-24 w-auto"
            />
          </a>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-sm tracking-wider hover:text-gray-600 transition font-['Agency_FB']">HOME</a>
              <a href="/shop" className="text-sm tracking-wider hover:text-gray-600 transition font-['Agency_FB']">SHOP</a>
              <a href="/about" className="text-sm tracking-wider hover:text-gray-600 transition font-['Agency_FB']">ABOUT</a>
              <a href="/admin" className="text-sm tracking-wider hover:text-gray-600 transition font-['Agency_FB']">ADMIN</a>
            </nav>

            <div className="flex-1 md:flex-none md:w-40"></div>

            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition font-['Kabel']"
              />
              <button type="submit" className="p-2 bg-black text-white hover:bg-gray-800 transition">
                <Search className="w-5 h-5" />
              </button>
            </form>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 ml-auto"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <nav className="flex flex-col gap-4">
                <a href="/" className="text-sm tracking-wider hover:text-gray-600 transition font-['Agency_FB']">HOME</a>
                <a href="/shop" className="text-sm tracking-wider hover:text-gray-600 transition font-['Agency_FB']">SHOP</a>
                <a href="/about" className="text-sm tracking-wider hover:text-gray-600 transition font-['Agency_FB']">ABOUT</a>
                <a href="/admin" className="text-sm tracking-wider hover:text-gray-600 transition font-['Agency_FB']">ADMIN</a>
              </nav>
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition font-['Kabel']"
                />
                <button type="submit" className="p-2 bg-black text-white hover:bg-gray-800 transition">
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
