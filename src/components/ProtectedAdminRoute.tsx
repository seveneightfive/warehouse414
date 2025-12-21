import { ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [loading, user]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl tracking-wider mb-4">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl tracking-wider mb-4">Redirecting to login...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 shadow-sm text-center">
            <h1 className="text-3xl font-normal tracking-[0.08em] mb-4">ACCESS DENIED</h1>
            <p className="text-gray-600 mb-6">
              You do not have permission to access the admin panel.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              If you believe you should have access, please contact the administrator.
            </p>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="px-6 py-3 bg-black text-white tracking-[0.06em] hover:bg-gray-800 transition"
            >
              RETURN HOME
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
}
