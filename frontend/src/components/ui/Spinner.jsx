import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';

export default function Spinner({ size = 'md', text }) {
  const sizes = {
    sm:   { outer: 'h-8 w-8',  icon: 'h-3 w-3',  ring: 'border-2' },
    md:   { outer: 'h-12 w-12', icon: 'h-5 w-5', ring: 'border-2' },
    lg:   { outer: 'h-16 w-16', icon: 'h-7 w-7', ring: 'border-[3px]' },
    page: { outer: 'h-20 w-20', icon: 'h-9 w-9', ring: 'border-[3px]' },
  };
  const s = sizes[size];

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${s.outer}`}>
        {/* Spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className={`absolute inset-0 rounded-full ${s.ring} border-[#3b82f6] border-t-transparent`}
        />
        {/* Inner glow ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className={`absolute inset-1 rounded-full ${s.ring} border-[#8b5cf6]/30 border-b-transparent`}
        />
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Code2 className={`${s.icon} text-[#3b82f6]`} />
          </motion.div>
        </div>
      </div>
      {text && (
        <p className="text-sm text-[#8892b0] animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function PageSpinner({ text = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
      <Spinner size="page" text={text} />
    </div>
  );
}
