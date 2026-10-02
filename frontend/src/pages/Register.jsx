import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Code2, ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

/* Password strength calculator */
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}

const strengthMeta = [
  { label: 'Too weak',  color: 'bg-red-500',    text: 'text-red-400' },
  { label: 'Weak',      color: 'bg-orange-500',  text: 'text-orange-400' },
  { label: 'Fair',      color: 'bg-yellow-500',  text: 'text-yellow-400' },
  { label: 'Good',      color: 'bg-blue-500',    text: 'text-blue-400' },
  { label: 'Strong',    color: 'bg-green-500',   text: 'text-green-400' },
];

/* Left panel animated items */
const perks = [
  { icon: Zap,          text: 'Zero-setup — code in seconds'       },
  { icon: CheckCircle2, text: 'Free forever — no credit card'       },
  { icon: CheckCircle2, text: 'Invite unlimited collaborators'       },
  { icon: CheckCircle2, text: 'Run code in 10+ languages instantly' },
];

export default function Register() {
  const [email,    setEmail]    = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { register, loginWithGithub } = useAuth();
  const navigate     = useNavigate();

  const strength = password.length > 0 ? getStrength(password) : -1;
  const meta     = strength >= 0 ? strengthMeta[strength] : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 bg-[#0c1220] border-r border-[rgba(255,255,255,0.05)] relative overflow-hidden"
      >
        {/* Background */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#8b5cf6] opacity-[0.06] blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#3b82f6] opacity-[0.06] blur-[100px]" />
        <div className="absolute inset-0 grid-bg opacity-50" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: -15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#8b5cf6] rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] p-2.5 rounded-xl">
                <Code2 className="h-6 w-6 text-white" />
              </div>
            </motion.div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white">Code<span className="text-[#8b5cf6]">Sync</span></span>
              <p className="text-[10px] text-[#4a5568] uppercase tracking-widest font-medium">Collaborative IDE</p>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight"
          >
            Start building{' '}
            <span className="gradient-text">together</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-[#4a5568] text-base mb-10 leading-relaxed"
          >
            A full-stack internship project showcasing real-time collaboration,
            sandboxed JavaScript and Python execution, and production-grade auth.
          </motion.p>

          <div className="space-y-4">
            {perks.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[#a78bfa]" />
                </div>
                <span className="text-sm text-[#8892b0]">{text}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-3 gap-3 mt-12"
          >
            {[
              { val: 'Yjs',      label: 'CRDTs'      },
              { val: 'Node/Py',  label: 'Engine'     },
              { val: 'Monaco',   label: 'Editor'     },
            ].map(({ val, label }) => (
              <div key={label} className="text-center p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                <div className="text-sm font-extrabold gradient-text">{val}</div>
                <div className="text-[11px] text-[#2d3748] uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer text */}
        <div className="relative z-10">
          <p className="text-xs text-[#2d3748]">By creating an account you agree to our Terms of Service and Privacy Policy.</p>
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
            <div className="bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] p-2 rounded-xl">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">Code<span className="text-[#8b5cf6]">Sync</span></span>
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
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Create your account</h1>
            <p className="text-[#4a5568]">Free forever. No credit card required.</p>
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

            <Input
              label="Username"
              type="text"
              required
              placeholder="johndoe"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/\s+/g, ''))}
              icon={<User className="h-4 w-4" />}
              hint="Letters, numbers, no spaces"
            />

            {/* Password with strength meter */}
            <div>
              <Input
                label="Password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
              />

              {/* Strength meter */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2.5"
                >
                  <div className="flex gap-1.5 mb-1.5">
                    {[0, 1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: strength > i ? 1 : 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className={`h-1 flex-1 rounded-full origin-left ${
                          strength > i
                            ? (meta?.color ?? 'bg-gray-600')
                            : 'bg-[rgba(255,255,255,0.06)]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${meta?.text ?? ''}`}>
                    {meta?.label}
                  </p>
                </motion.div>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              variant="purple"
              loading={loading}
              iconRight={!loading && <ArrowRight className="h-4 w-4" />}
              className="mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </motion.form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.05)]" />
            <span className="text-xs text-[#2d3748] uppercase tracking-widest font-semibold">or</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.05)]" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-[#4a5568] mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#8b5cf6] hover:text-[#a78bfa] font-semibold transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
