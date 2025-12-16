import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { ShopStateProvider } from './contexts/ShopStateContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  const routes = () => {
    if (currentPath === '/' || currentPath === '/home') {
      return <Home />;
    }

    if (currentPath === '/shop') {
      return <Shop />;
    }

    if (currentPath.startsWith('/product/')) {
      const productId = currentPath.split('/product/')[1];
      return <ProductDetail productId={productId} />;
    }

    if (currentPath === '/login') {
      return <Login />;
    }

    if (currentPath === '/admin') {
      return <Admin />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
          <a href="/" className="text-blue-600 hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  };

  return (
    <AuthProvider>
      <ShopStateProvider>
        {routes()}
      </ShopStateProvider>
    </AuthProvider>
  );
}

export default App;
