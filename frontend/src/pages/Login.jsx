import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Code2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-['Inter'] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3b82f6]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8b5cf6]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="bg-[#3b82f6] p-2.5 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-transform">
              <Code2 className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-[#dae2fd]">CodeSync</span>
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-[#8c909f] mt-2">Sign in to your account to continue</p>
        </div>

        <div className="bg-[#0b1326]/80 backdrop-blur-xl border border-[rgba(255,255,255,0.05)] p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]"></div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#8c909f] uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-xl bg-[#171f33]/50 border border-[rgba(255,255,255,0.05)] text-[#dae2fd] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#424754]"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-[#8c909f] uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-[#3b82f6] hover:text-[#dae2fd] font-medium transition-colors">Forgot password?</a>
              </div>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl bg-[#171f33]/50 border border-[rgba(255,255,255,0.05)] text-[#dae2fd] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#424754]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white flex justify-center items-center gap-2 mt-4 py-3 rounded-xl font-medium transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </motion.button>
          </form>
          
          <div className="mt-6 flex items-center justify-between before:content-[''] before:flex-1 before:h-px before:bg-[rgba(255,255,255,0.05)] after:content-[''] after:flex-1 after:h-px after:bg-[rgba(255,255,255,0.05)]">
            <span className="text-xs text-[#424754] uppercase tracking-widest px-4">OR</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex justify-center items-center gap-2 py-2.5 rounded-xl bg-[#171f33]/50 border border-[rgba(255,255,255,0.05)] text-[#dae2fd] text-sm font-medium hover:bg-[#171f33] transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
              Google
            </button>
            <button className="flex justify-center items-center gap-2 py-2.5 rounded-xl bg-[#171f33]/50 border border-[rgba(255,255,255,0.05)] text-[#dae2fd] text-sm font-medium hover:bg-[#171f33] transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              GitHub
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-[#8c909f]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#3b82f6] hover:text-[#dae2fd] font-medium transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
