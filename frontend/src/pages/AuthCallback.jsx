import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const token = searchParams.get('token');

    const completeAuth = async () => {
      try {
        if (code) {
          // Clean the browser URL bar immediately
          window.history.replaceState({}, document.title, window.location.pathname);

          const res = await api.post('/auth/oauth/exchange', { code });
          const { accessToken, user } = res.data.data;

          setToken(accessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          setUser(user);

          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 600);
        } else if (token) {
          // Legacy fallback
          window.history.replaceState({}, document.title, window.location.pathname);
          setToken(token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const profileRes = await api.get('/users/profile');
          setUser(profileRes.data.data.user);

          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 600);
        } else {
          // No credentials found
          setStatus('error');
          setErrorMessage('No authentication authorization code provided.');
          setTimeout(() => navigate('/login', { replace: true }), 2500);
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'Authentication handoff failed.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    };

    completeAuth();
  }, [searchParams, navigate, setToken, setUser]);

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0c1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        {status === 'processing' && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-[#3b82f6]/20 border-t-[#3b82f6] animate-spin" />
              <Loader2 className="h-6 w-6 text-[#3b82f6] absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Completing Authentication</h2>
              <p className="text-sm text-[#8892b0]">Securing session token...</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Signed In Successfully</h2>
              <p className="text-sm text-[#8892b0]">Redirecting to your dashboard...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Authentication Failed</h2>
              <p className="text-sm text-rose-300/80 mb-3">{errorMessage}</p>
              <p className="text-xs text-[#4a5568]">Returning to login page...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
