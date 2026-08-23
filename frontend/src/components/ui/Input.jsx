import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon,
  hint,
  required,
  disabled,
  className = '',
  inputClassName = '',
  autoFocus,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-[#8892b0] uppercase tracking-widest mb-2">
          {label}
          {required && <span className="text-[#3b82f6] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Left icon */}
        {icon && (
          <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused ? 'text-[#3b82f6]' : 'text-[#4a5568]'}`}>
            {icon}
          </div>
        )}

        <input
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-[#111827] text-[#f0f4ff]
            border transition-all duration-200
            placeholder:text-[#374151]
            focus:outline-none
            disabled:opacity-40 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-12' : ''}
            ${error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-[rgba(255,255,255,0.07)] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20'
            }
            ${inputClassName}
          `}
          {...props}
        />

        {/* Focus glow overlay */}
        <motion.div
          animate={{ opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: error ? '0 0 0 2px rgba(239,68,68,0.15)' : '0 0 0 2px rgba(59,130,246,0.1)' }}
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#8892b0] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="flex items-center gap-1.5 mt-2 text-xs text-red-400"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hint */}
      {hint && !error && (
        <p className="mt-2 text-xs text-[#4a5568]">{hint}</p>
      )}
    </div>
  );
}
