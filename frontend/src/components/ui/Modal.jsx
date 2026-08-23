import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md', accent = 'blue' }) {
  const accentGradient = {
    blue:   'from-[#3b82f6] to-[#8b5cf6]',
    green:  'from-[#22c55e] to-[#06b6d4]',
    red:    'from-[#ef4444] to-[#f97316]',
    purple: 'from-[#8b5cf6] to-[#ec4899]',
  };

  const sizeClass = {
    sm:  'max-w-sm',
    md:  'max-w-md',
    lg:  'max-w-lg',
    xl:  'max-w-2xl',
  };

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#070b14]/85 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`relative w-full ${sizeClass[size]} bg-[#0c1220] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden`}
          >
            {/* Gradient top bar */}
            <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${accentGradient[accent]}`} />

            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4 mt-1">
              <h3 className="text-lg font-bold text-[#f0f4ff] tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                className="text-[#4a5568] hover:text-[#f0f4ff] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.09)] p-1.5 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
