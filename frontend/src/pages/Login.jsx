import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Code2, ArrowRight, Mail, Lock, AlertCircle, Zap, Users, Server, GitBranch } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const codeSnippet = `// CodeSync — Real-time collaboration
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

const doc = new Y.Doc();
const provider = new WebsocketProvider(
  'wss://codesync.app/collab',
  'project-x9za',
  doc
);

// Bind to Monaco editor
const yText = doc.getText('code');
const binding = new MonacoBinding(
  yText, 
  editor.getModel(),
  new Set([editor]),
  provider.awareness
);

console.log('🚀 Collaboration live!');`;

const features = [
  { icon: Users,     text: 'Real-time multiplayer editing'  },
  { icon: Server,    text: 'Isolated Docker execution'      },
  { icon: GitBranch, text: 'Project workspaces & sharing'   },
];

export default function Login() {
  const { login, loginWithGithub } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex font-['Inter'] overflow-hidden">

      {/* ─── LEFT PANEL — decorative ─── */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 bg-[#0c1220] border-r border-[rgba(255,255,255,0.05)] relative overflow-hidden"
      >
        {/* Background orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3b82f6] opacity-[0.06] blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#8b5cf6] opacity-[0.06] blur-[100px]" />
        <div className="absolute inset-0 grid-bg opacity-50" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#3b82f6] rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-2.5 rounded-xl">
                <Code2 className="h-6 w-6 text-white" />
              </div>
            </motion.div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white">Code<span className="text-[#3b82f6]">Sync</span></span>
              <p className="text-[10px] text-[#4a5568] uppercase tracking-widest font-medium">Collaborative IDE</p>
            </div>
          </Link>
        </div>

        {/* Code window */}
        <div className="relative z-10 flex-1 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {/* Window chrome */}
            <div className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-2xl">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-[#0c1220] border-b border-[rgba(255,255,255,0.06)]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                <span className="ml-2 text-[10px] text-[#4a5568] font-mono">collab.js</span>
              </div>
              <pre className="p-5 bg-[#070b14] text-[11.5px] font-mono leading-relaxed overflow-x-auto">
                {codeSnippet.split('\n').map((line, i) => {
                  const lineColor = (str) => {
                    if (str.startsWith('//')) return 'text-[#546e7a] italic';
                    if (str.includes("'") || str.includes('"')) return '';
                    return '';
                  };
                  return (
                    <div key={i} className="flex gap-4">
                      <span className="text-[#2d3748] select-none w-4 text-right shrink-0">{i + 1}</span>
                      <span className={`${line.startsWith('//') ? 'text-[#546e7a] italic' : 'text-[#c9d1e0]'}`}>{line}</span>
                    </div>
                  );
                })}
              </pre>
            </div>

            {/* Features list */}
            <div className="mt-6 space-y-3">
              {features.map(({ icon: Icon, text }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 text-sm text-[#8892b0]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-[#60a5fa]" />
                  </div>
                  {text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom — honest project note */}
        <div className="relative z-10 p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
          <p className="text-[11px] font-bold text-[#2d3748] uppercase tracking-widest mb-2">About this project</p>
          <p className="text-sm text-[#4a5568] leading-relaxed">
            CodeSync is a portfolio/internship project demonstrating full-stack engineering —
            Yjs CRDTs, Docker execution, Monaco editor, JWT auth, and WebSocket collaboration.
          </p>
        </div>
      </motion.div>

      {/* ─── RIGHT PANEL — form ─── */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex items-center justify-center p-8 relative"
      >
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-2 rounded-xl">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">Code<span className="text-[#3b82f6]">Sync</span></span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome back</h1>
            <p className="text-[#4a5568]">Sign in to continue to your workspace</p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <Input
              label="Email address"
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
            />

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[#8892b0] uppercase tracking-widest">Password</label>
                <a href="#" className="text-xs text-[#3b82f6] hover:text-[#60a5fa] font-medium transition-colors">
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              iconRight={!loading && <ArrowRight className="h-4 w-4" />}
              className="mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </motion.form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.05)]" />
            <span className="text-xs text-[#2d3748] uppercase tracking-widest font-semibold">or</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.05)]" />
          </div>

          {/* Social buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              {
                label: 'Google',
                svg: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )
              },
              {
                label: 'GitHub',
                svg: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                )
              }
            ].map(({ label, svg }) => (
              <motion.button
                key={label}
                type="button"
                onClick={label === 'GitHub' ? loginWithGithub : undefined}
                whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.07)] text-[#8892b0] hover:text-[#f0f4ff] text-sm font-medium transition-all"
              >
                {svg}
                {label}
              </motion.button>
            ))}
          </motion.div>

          {/* Footer */}
          <p className="text-center text-sm text-[#4a5568] mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#3b82f6] hover:text-[#60a5fa] font-semibold transition-colors">
              Create one free →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
