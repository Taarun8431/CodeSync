import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Folder, FileCode, FileJson, FileText, FilePlus, FolderPlus, ChevronRight } from 'lucide-react';
import { useState } from 'react';

// Map file extensions → icon + color
function FileIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase();
  const map = {
    js:   { icon: FileCode,  color: 'text-yellow-400' },
    jsx:  { icon: FileCode,  color: 'text-cyan-400' },
    ts:   { icon: FileCode,  color: 'text-blue-400' },
    tsx:  { icon: FileCode,  color: 'text-blue-400' },
    py:   { icon: FileCode,  color: 'text-green-400' },
    json: { icon: FileJson,  color: 'text-yellow-300' },
    html: { icon: FileCode,  color: 'text-orange-400' },
    css:  { icon: FileCode,  color: 'text-blue-300' },
    md:   { icon: FileText,  color: 'text-[#8892b0]' },
    go:   { icon: FileCode,  color: 'text-cyan-300' },
    cpp:  { icon: FileCode,  color: 'text-purple-400' },
    java: { icon: FileCode,  color: 'text-red-400' },
  };
  const cfg = map[ext] || { icon: FileText, color: 'text-[#4a5568]' };
  const Icon = cfg.icon;
  return <Icon className={`h-3.5 w-3.5 shrink-0 ${cfg.color}`} />;
}

function FolderNode({ folder, depth, files, activeFileId, selectedFolderId, setSelectedFolderId, onFileClick, newItemType, newItemName, setNewItemName, handleNewItemSubmit, handleNewItemKeyDown, renderTree }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <motion.div
        onClick={(e) => { e.stopPropagation(); setSelectedFolderId(folder.id); setOpen(o => !o); }}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        className={`flex items-center gap-1.5 py-[5px] rounded-md cursor-pointer transition-colors group
          ${selectedFolderId === folder.id ? 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa]' : 'text-[#8892b0]'}`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight className="h-3 w-3 opacity-50" />
        </motion.span>
        {open
          ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#8b5cf6]" />
          : <Folder    className="h-3.5 w-3.5 shrink-0 text-[#8b5cf6]" />
        }
        <span className="text-[12.5px] font-medium truncate group-hover:text-[#f0f4ff] transition-colors">
          {folder.name}
        </span>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {renderTree(folder.id, depth + 1)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FileExplorer({
  files, activeFileId, selectedFolderId, setSelectedFolderId,
  onFileClick, newItemType, setNewItemType,
  newItemName, setNewItemName,
  handleNewItemSubmit, handleNewItemKeyDown,
  onCreateFile, onCreateFolder,
}) {
  const renderTree = (parentId = null, depth = 0) => {
    const nodeFolders = files.filter(f => f.type === 'folder' && (f.parentId || null) === parentId);
    const nodeFiles   = files.filter(f => f.type === 'file'   && (f.folderId  || null) === parentId);

    return (
      <>
        {nodeFolders.map(folder => (
          <FolderNode
            key={folder.id}
            folder={folder}
            depth={depth}
            files={files}
            activeFileId={activeFileId}
            selectedFolderId={selectedFolderId}
            setSelectedFolderId={setSelectedFolderId}
            onFileClick={onFileClick}
            newItemType={newItemType}
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            handleNewItemSubmit={handleNewItemSubmit}
            handleNewItemKeyDown={handleNewItemKeyDown}
            renderTree={renderTree}
          />
        ))}

        {nodeFiles.map(file => (
          <motion.div
            key={file.id}
            onClick={(e) => { e.stopPropagation(); onFileClick(file.id); }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            className={`flex items-center gap-1.5 py-[5px] rounded-md cursor-pointer transition-colors group
              ${activeFileId === file.id
                ? 'bg-[rgba(59,130,246,0.1)] text-[#60a5fa]'
                : 'text-[#6b7280]'
              }`}
            style={{ paddingLeft: `${depth * 14 + 20}px` }}
          >
            <FileIcon name={file.name} />
            <span className={`text-[12.5px] truncate transition-colors ${activeFileId === file.id ? 'text-[#93c5fd] font-medium' : 'group-hover:text-[#c9d1e0]'}`}>
              {file.name}
            </span>
          </motion.div>
        ))}

        {/* Inline new item input */}
        {newItemType && selectedFolderId === parentId && (
          <div
            className="flex items-center gap-1.5 py-[5px] rounded-md bg-[rgba(59,130,246,0.08)] border border-[#3b82f6]/30"
            style={{ paddingLeft: `${depth * 14 + 20}px` }}
            onClick={e => e.stopPropagation()}
          >
            {newItemType === 'folder'
              ? <Folder   className="h-3.5 w-3.5 shrink-0 text-[#8b5cf6]" />
              : <FileText className="h-3.5 w-3.5 shrink-0 text-[#4a5568]" />
            }
            <input
              autoFocus
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyDown={handleNewItemKeyDown}
              onBlur={() => { if (!newItemName.trim()) setNewItemType(null); }}
              className="bg-transparent text-[12.5px] text-white focus:outline-none w-full caret-[#3b82f6]"
              placeholder={newItemType === 'folder' ? 'folder-name' : 'filename.js'}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgba(255,255,255,0.04)]">
        <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Explorer</span>
        <div className="flex gap-0.5">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onCreateFile}
            title="New File"
            className="p-1.5 text-[#4a5568] hover:text-[#f0f4ff] hover:bg-[rgba(255,255,255,0.06)] rounded-md transition-all"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onCreateFolder}
            title="New Folder"
            className="p-1.5 text-[#4a5568] hover:text-[#f0f4ff] hover:bg-[rgba(255,255,255,0.06)] rounded-md transition-all"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Tree */}
      <div
        className="flex-1 overflow-y-auto p-2 space-y-0.5"
        onClick={() => setSelectedFolderId(null)}
      >
        {renderTree(null, 0)}

        {files.length === 0 && (
          <div className="text-center py-8 px-4">
            <div className="text-[#2d3748] text-xs mb-2">No files yet</div>
            <button
              onClick={onCreateFile}
              className="text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
            >
              + Create a file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
