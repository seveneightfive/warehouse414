export default function Footer() {
  return (
    <footer className="bg-black text-white mt-20">

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 tracking-wider">WAREHOUSE 414</h3>
            <p className="text-gray-400 text-sm leading-relaxed font-light lowercase">
              unique, one-of-a-kind high style furnishings. curated pieces for the discerning collector.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 tracking-wider">QUICK LINKS</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-gray-400 hover:text-white transition font-light lowercase">home</a></li>
              <li><a href="/shop" className="text-gray-400 hover:text-white transition font-light lowercase">shop</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-white transition font-light lowercase">about</a></li>
              <li><a href="/admin" className="text-gray-400 hover:text-white transition font-light lowercase">admin</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 tracking-wider">ALSO AVAILABLE ON</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://1stdibs.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition font-light">1stDibs</a></li>
              <li><a href="https://charish.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition font-light">Charish</a></li>
              <li><a href="https://ebay.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition font-light">eBay</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>2024 Warehouse 414. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
