import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, ChevronRight, Menu, X, Zap } from 'lucide-react';

export default function Navbar({ theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location]);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Docs', href: '/#docs' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#070b14]/90 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#3b82f6] rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-2 rounded-xl shadow-lg">
                  <Code2 className="h-5 w-5 text-white" />
                </div>
              </motion.div>
              <div className="flex flex-col">
                <span className="font-bold text-[17px] tracking-tight text-white leading-none">
                  Code<span className="text-[#3b82f6]">Sync</span>
                </span>
                <span className="text-[9px] text-[#4a5568] tracking-widest uppercase font-medium">Collaborative IDE</span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-[#8892b0] hover:text-[#f0f4ff] rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-all"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-[#8892b0] hover:text-[#f0f4ff] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.05)]"
              >
                Sign In
              </Link>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-shadow"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Get Started
                </motion.button>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-lg text-[#8892b0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed top-16 left-0 right-0 z-40 bg-[#0c1220]/95 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-[#8892b0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all font-medium"
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4 opacity-40" />
                </motion.a>
              ))}
              <div className="border-t border-[rgba(255,255,255,0.06)] mt-2 pt-4 flex flex-col gap-2">
                <Link to="/login" className="text-center px-4 py-3 text-sm font-medium text-[#8892b0] hover:text-white rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-all">
                  Sign In
                </Link>
                <Link to="/register" className="text-center px-4 py-3 text-sm font-semibold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white rounded-xl">
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
