import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSent(false);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Login error:', signInError);

        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before logging in.');
        } else {
          setError(signInError.message);
        }

        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('Login successful for:', data.user.email);
        window.history.pushState({}, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setResetLoading(true);
    setError('');
    setResetSent(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        console.error('Password reset error:', resetError);

        if (resetError.message.includes('Email rate limit exceeded')) {
          setError('Too many reset attempts. Please try again in a few minutes.');
        } else if (resetError.message.includes('email not found')) {
          setError('No account found with this email address.');
        } else {
          setError(`Password reset failed: ${resetError.message}`);
        }
      } else {
        setResetSent(true);
        console.log('Password reset email sent to:', email);
      }
    } catch (err) {
      console.error('Unexpected error during password reset:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Admin Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to access the admin panel
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
            {resetSent && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-800 space-y-2">
                  <p className="font-medium">Password reset email sent!</p>
                  <p>Check your inbox for a password reset link. If you don't see it, please check your spam folder.</p>
                  <p className="text-xs text-green-700 mt-2">
                    Note: If you're using the default Supabase email service, emails may only be delivered to authorized team members. For production use, configure a custom SMTP provider in your Supabase dashboard.
                  </p>
                </div>
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              {resetLoading ? 'Sending...' : 'Forgot your password?'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
