import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, ChevronUp, Trash2 } from 'lucide-react';

export default function OutputPanel({
  isOpen, onClose,
  activeTab, setActiveTab,
  output, isExecuting,
  onClear,
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="output-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 260, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="bg-[#070b14] border-t border-[rgba(255,255,255,0.05)] flex flex-col shrink-0"
        >
          {/* Tab bar */}
          <div className="flex items-center bg-[#0c1220] border-b border-[rgba(255,255,255,0.04)] px-2 shrink-0">
            {['output', 'terminal'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 text-[11px] font-bold uppercase tracking-widest
                  border-b-2 transition-all
                  ${activeTab === tab
                    ? 'border-[#3b82f6] text-[#60a5fa]'
                    : 'border-transparent text-[#4a5568] hover:text-[#8892b0]'}
                `}
              >
                {tab}
              </button>
            ))}

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-1 pr-1">
              {output && activeTab === 'output' && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClear}
                  title="Clear output"
                  className="p-1.5 text-[#4a5568] hover:text-red-400 rounded-md hover:bg-[rgba(239,68,68,0.08)] transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 text-[#4a5568] hover:text-[#f0f4ff] rounded-md hover:bg-[rgba(255,255,255,0.06)] transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed relative">
            {activeTab === 'output' && (
              <>
                {isExecuting ? (
                  <div className="flex items-center gap-3 text-[#8892b0]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-[#3b82f6] border-t-transparent rounded-full"
                    />
                    <span className="text-[#60a5fa]">Executing...</span>
                  </div>
                ) : output ? (
                  <pre className={`whitespace-pre-wrap break-words ${
                    output.toLowerCase().includes('error') || output.toLowerCase().includes('failed')
                      ? 'text-red-400'
                      : 'text-[#d1fae5]'
                  }`}>
                    {output}
                  </pre>
                ) : (
                  <div className="flex items-center gap-2 text-[#2d3748]">
                    <Terminal className="h-4 w-4" />
                    <span>Run your code to see output here...</span>
                  </div>
                )}
              </>
            )}

            {activeTab === 'terminal' && (
              <div className="text-[#d1fae5]">
                <span className="text-[#4ade80]">user@codesync</span>
                <span className="text-[#8892b0]">:</span>
                <span className="text-[#60a5fa]">~/workspace</span>
                <span className="text-[#8892b0]">$ </span>
                <span className="cursor-blink" />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
