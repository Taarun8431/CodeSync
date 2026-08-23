import { motion, AnimatePresence } from 'framer-motion';
import { X, FileCode, FileJson, FileText, Circle } from 'lucide-react';

function FileTabIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase();
  const map = {
    js:   { icon: FileCode, color: 'text-yellow-400' },
    jsx:  { icon: FileCode, color: 'text-cyan-400' },
    ts:   { icon: FileCode, color: 'text-blue-400' },
    tsx:  { icon: FileCode, color: 'text-blue-400' },
    py:   { icon: FileCode, color: 'text-green-400' },
    json: { icon: FileJson, color: 'text-yellow-300' },
    html: { icon: FileCode, color: 'text-orange-400' },
    css:  { icon: FileCode, color: 'text-blue-300' },
    md:   { icon: FileText, color: 'text-[#8892b0]' },
  };
  const cfg = map[ext] || { icon: FileText, color: 'text-[#4a5568]' };
  const Icon = cfg.icon;
  return <Icon className={`h-3.5 w-3.5 shrink-0 ${cfg.color}`} />;
}

export default function EditorTabs({ openFiles, files, activeFileId, onSelect, onClose }) {
  return (
    <div className="flex bg-[#0c1220] overflow-x-auto hide-scrollbar border-b border-[rgba(255,255,255,0.04)] shrink-0">
      <AnimatePresence initial={false}>
        {openFiles.map(fileId => {
          const f = files.find(x => x.id === fileId);
          if (!f) return null;
          const isActive = activeFileId === fileId;

          return (
            <motion.div
              key={fileId}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => onSelect(fileId)}
              className={`
                group relative flex items-center gap-2 px-4 py-2
                border-r border-[rgba(255,255,255,0.04)]
                min-w-[120px] max-w-[180px] cursor-pointer
                text-[12.5px] transition-colors select-none shrink-0
                ${isActive
                  ? 'bg-[#111827] text-[#f0f4ff]'
                  : 'bg-transparent text-[#4a5568] hover:text-[#8892b0] hover:bg-[rgba(255,255,255,0.02)]'
                }
              `}
            >
              {/* Active indicator top border */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full"
                />
              )}

              <FileTabIcon name={f.name} />
              <span className="truncate font-medium">{f.name}</span>

              {/* Close btn */}
              <motion.button
                onClick={e => onClose(e, fileId)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className={`
                  ml-auto shrink-0 p-0.5 rounded
                  transition-all
                  ${isActive ? 'text-[#4a5568] hover:text-[#f0f4ff] hover:bg-[rgba(255,255,255,0.1)]' : 'opacity-0 group-hover:opacity-100 text-[#4a5568] hover:text-[#f0f4ff] hover:bg-[rgba(255,255,255,0.1)]'}
                `}
              >
                <X className="h-3 w-3" />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
