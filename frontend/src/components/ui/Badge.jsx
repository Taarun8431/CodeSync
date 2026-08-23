const variants = {
  blue:   'bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/20',
  purple: 'bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/20',
  green:  'bg-[#22c55e]/10 text-[#4ade80] border-[#22c55e]/20',
  red:    'bg-red-500/10  text-red-400   border-red-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  gray:   'bg-[rgba(255,255,255,0.05)] text-[#8892b0] border-[rgba(255,255,255,0.08)]',
  cyan:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const dotColors = {
  blue:   'bg-[#3b82f6]',
  purple: 'bg-[#8b5cf6]',
  green:  'bg-[#22c55e]',
  red:    'bg-red-500',
  yellow: 'bg-yellow-500',
  gray:   'bg-[#8892b0]',
  cyan:   'bg-cyan-500',
};

export default function Badge({ children, variant = 'blue', dot = false, className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        text-[11px] font-bold tracking-wider uppercase
        rounded-full border
        ${variants[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${variant === 'green' ? 'shadow-[0_0_6px_rgba(34,197,94,0.8)]' : ''}`} />
      )}
      {children}
    </span>
  );
}
