import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Play, LogOut, Users, Check,
  PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen,
  Loader2, Copy, ChevronRight, Slash
} from 'lucide-react';

import FileExplorer from '../components/workspace/FileExplorer';
import EditorTabs   from '../components/workspace/EditorTabs';
import OutputPanel  from '../components/workspace/OutputPanel';
import ChatPanel    from '../components/workspace/ChatPanel';

/* ─── WS base URL — env var for production ─── */
const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/api/v1/collaboration';

// ─── Deterministic user color from username
const USER_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e',
  '#f59e0b', '#06b6d4', '#ef4444', '#a855f7',
  '#14b8a6', '#f97316',
];

const getUserColor = (username = '') => {
  let hash = 0;
  for (const ch of username) hash = (hash + ch.charCodeAt(0)) % USER_COLORS.length;
  return USER_COLORS[hash];
};

export default function Workspace() {
  const { projectId } = useParams();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  // ── Layout
  const [leftOpen,   setLeftOpen]   = useState(true);
  const [rightOpen,  setRightOpen]  = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [saveToast,  setSaveToast]  = useState(false);

  // ── Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput,    setChatInput]    = useState('');
  const [chatArray,    setChatArray]    = useState(null);

  // ── Invite
  const [joinCode, setJoinCode] = useState('');
  const [copied,   setCopied]   = useState(false);

  // ── File system
  const [files,          setFiles]          = useState([]);
  const [activeFileId,   setActiveFileId]   = useState(null);
  const [openFiles,      setOpenFiles]      = useState([]);
  const [treeLoading,    setTreeLoading]    = useState(true);
  const [treeVersion,    setTreeVersion]    = useState(0);
  const [newItemType,    setNewItemType]    = useState(null);
  const [newItemName,    setNewItemName]    = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);

  // ── Execution
  const [language,   setLanguage]   = useState('javascript');
  const [executing,  setExecuting]  = useState(false);
  const [output,     setOutput]     = useState('');
  const [bottomTab,  setBottomTab]  = useState('output');

  // ── Monaco
  const editorRef    = useRef(null);
  const providerRef  = useRef(null);
  const bindingRef   = useRef(null);
  const modelsRef    = useRef({});
  const [monacoInst, setMonacoInst] = useState(null);
  const [treeEventsMap, setTreeEventsMap] = useState(null);

  const [projectName, setProjectName] = useState('');

  // ─── Fetch VFS tree
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/vfs/tree`);
        const { folders, files } = res.data.data;
        const all = [
          ...folders.map(f => ({ ...f, type: 'folder' })),
          ...files.map(f => ({ ...f, type: 'file' })),
        ];
        setFiles(all);
        if (files.length > 0 && !activeFileId) {
          setActiveFileId(files[0].id);
          setOpenFiles([files[0].id]);
        }
      } catch (err) {
        console.error('VFS tree error', err);
      } finally {
        setTreeLoading(false);
      }
    };
    fetchTree();
  }, [projectId, treeVersion]);

  // ─── Fetch project name
  useEffect(() => {
    api.get(`/projects/${projectId}`)
      .then(res => setProjectName(res.data.data.project?.name || 'Workspace'))
      .catch(() => {});
  }, [projectId]);

  // ─── Connect Chat + Tree events
  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      WS_BASE, `project-chat:${projectId}`, doc, { params: { token } }
    );

    const ychat = doc.getArray('chat');
    setChatArray(ychat);
    ychat.observe(() => setChatMessages(ychat.toArray()));
    setChatMessages(ychat.toArray());

    const yTree = doc.getMap('treeEvents');
    setTreeEventsMap(yTree);
    yTree.observe(() => setTreeVersion(v => v + 1));

    return () => provider.destroy();
  }, [projectId, token]);

  // ─── Editor mount
  const handleEditorMount = async (editor, monaco) => {
    editorRef.current = editor;
    setMonacoInst(monaco);

    if (activeFileId && !modelsRef.current[activeFileId]) {
      try {
        const res = await api.get(`/projects/${projectId}/vfs/files/${activeFileId}`);
        const f = res.data.data.file;
        modelsRef.current[activeFileId] = monaco.editor.createModel(
          f.content || '', f.language || 'plaintext',
          monaco.Uri.file(`${f.id}-${f.name}`)
        );
        editor.setModel(modelsRef.current[activeFileId]);
        bindEditor(activeFileId);
      } catch (err) { console.error(err); }
    } else if (activeFileId && modelsRef.current[activeFileId]) {
      editor.setModel(modelsRef.current[activeFileId]);
      bindEditor(activeFileId);
    }
  };

  const bindEditor = (fileId) => {
    if (!editorRef.current) return;
    if (bindingRef.current) bindingRef.current.destroy();
    if (providerRef.current) providerRef.current.destroy();

    const doc = new Y.Doc();
    providerRef.current = new WebsocketProvider(
      WS_BASE, `file:${fileId}`, doc, { params: { token } }
    );

    const type = doc.getText('monaco');
    bindingRef.current = new MonacoBinding(
      type, editorRef.current.getModel(),
      new Set([editorRef.current]),
      providerRef.current.awareness
    );

    // ─── Cursor Awareness Setup
    if (user) {
      providerRef.current.awareness.setLocalStateField('user', {
        name: user.username,
        color: getUserColor(user.username),
      });
    }

    const yNotif = doc.getMap('notifications');
    yNotif.observe(e => {
      if (e.keysChanged.has('lastSaved')) {
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 3000);
      }
    });
  };

  // ─── Swap model when file changes
  useEffect(() => {
    const load = async () => {
      if (!editorRef.current || !monacoInst || !activeFileId) return;
      if (!modelsRef.current[activeFileId]) {
        try {
          const res = await api.get(`/projects/${projectId}/vfs/files/${activeFileId}`);
          const f = res.data.data.file;
          modelsRef.current[activeFileId] = monacoInst.editor.createModel(
            f.content || '', f.language || 'plaintext',
            monacoInst.Uri.file(`${f.id}-${f.name}`)
          );
        } catch (err) { console.error(err); return; }
      }
      editorRef.current.setModel(modelsRef.current[activeFileId]);
      bindEditor(activeFileId);
    };
    load();
  }, [activeFileId, monacoInst, projectId]);

  // ─── File helpers
  const inferLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      js: 'javascript', jsx: 'javascript',
      ts: 'typescript', tsx: 'typescript',
      py: 'python', html: 'html', css: 'css',
      json: 'json', java: 'java',
      cpp: 'cpp', c: 'cpp', go: 'go', md: 'markdown',
    };
    return map[ext] || 'plaintext';
  };

  const handleNewItemSubmit = async () => {
    if (!newItemName.trim()) { setNewItemType(null); return; }
    try {
      if (newItemType === 'file') {
        const res = await api.post(`/projects/${projectId}/vfs/files`, {
          name: newItemName.trim(),
          language: inferLanguage(newItemName.trim()),
          folderId: selectedFolder,
        });
        const newFile = { ...res.data.data.file, type: 'file' };
        setFiles(p => [...p, newFile]);
        setOpenFiles(p => [...p, newFile.id]);
        setActiveFileId(newFile.id);
      } else {
        const res = await api.post(`/projects/${projectId}/vfs/folders`, {
          name: newItemName.trim(), parentId: selectedFolder,
        });
        setFiles(p => [...p, { ...res.data.data.folder, type: 'folder' }]);
      }
      treeEventsMap?.set('lastUpdate', Date.now());
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
    setNewItemType(null);
    setNewItemName('');
  };

  const handleNewItemKeyDown = (e) => {
    if (e.key === 'Enter') handleNewItemSubmit();
    if (e.key === 'Escape') { setNewItemType(null); setNewItemName(''); }
  };

  const handleFileClick = (fileId) => {
    if (!openFiles.includes(fileId)) setOpenFiles(p => [...p, fileId]);
    setActiveFileId(fileId);
  };

  const handleCloseFile = (e, fileId) => {
    e.stopPropagation();
    const next = openFiles.filter(id => id !== fileId);
    setOpenFiles(next);
    if (activeFileId === fileId) setActiveFileId(next.at(-1) ?? null);
  };

  // ─── Chat
  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatArray) return;
    chatArray.push([{
      user:      user?.username || user?.email || 'Unknown',
      text:      chatInput,
      timestamp: Date.now(),
    }]);
    setChatInput('');
  };

  // ─── Invite
  const generateInvite = async () => {
    try {
      const res = await api.post(`/projects/${projectId}/share`);
      setJoinCode(res.data.data.joinCode);
    } catch { alert('Failed to generate invite code'); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Run code
  const handleRun = async () => {
    if (!editorRef.current) return;
    setBottomOpen(true);
    setBottomTab('output');
    setExecuting(true);
    setOutput('Executing...\n');
    try {
      const res = await api.post(`/projects/${projectId}/execute`, {
        code: editorRef.current.getValue(),
        language,
      });
      const { run } = res.data.data;
      setOutput((run.stderr ? run.stderr + '\n' : '') + (run.stdout || 'Program exited cleanly with no output.'));
    } catch (err) {
      setOutput(err.response?.data?.message || 'Execution failed.');
    } finally {
      setExecuting(false);
    }
  };

  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className="h-screen flex flex-col bg-[#070b14] text-[#f0f4ff] overflow-hidden font-['Inter']">

      {/* ─── TOP NAV ─── */}
      <nav className="h-[46px] border-b border-[rgba(255,255,255,0.05)] bg-[#0c1220] flex items-center justify-between px-4 shrink-0 z-20">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="shrink-0">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#3b82f6] rounded-lg blur-md opacity-30 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-1.5 rounded-lg">
                <Code2 className="h-4 w-4 text-white" />
              </div>
            </div>
          </Link>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[12px] text-[#4a5568] min-w-0">
            <span className="hover:text-[#8892b0] cursor-pointer transition-colors" onClick={() => navigate('/dashboard')}>
              Dashboard
            </span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-[#8892b0] font-medium truncate">{projectName}</span>
            {activeFile && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="text-[#f0f4ff] font-medium truncate">{activeFile.name}</span>
              </>
            )}
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center gap-1 ml-2 border-l border-[rgba(255,255,255,0.05)] pl-3">
            <button
              onClick={() => setLeftOpen(o => !o)}
              title="Toggle Explorer"
              className="p-1.5 text-[#2d3748] hover:text-[#8892b0] hover:bg-[rgba(255,255,255,0.06)] rounded-md transition-all"
            >
              {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setRightOpen(o => !o)}
              title="Toggle Chat"
              className="p-1.5 text-[#2d3748] hover:text-[#8892b0] hover:bg-[rgba(255,255,255,0.06)] rounded-md transition-all"
            >
              {rightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language selector */}
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="bg-[#111827] border border-[rgba(255,255,255,0.08)] text-xs font-medium text-[#8892b0] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3b82f6]/50 cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-colors"
          >
            {['javascript','python'].map(l => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>

          {/* Run button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRun}
            disabled={executing}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              executing
                ? 'bg-[#2d3748] text-[#4a5568] cursor-not-allowed'
                : 'bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_0_15px_rgba(34,197,94,0.25)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
            }`}
          >
            {executing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Play className="h-3 w-3 fill-current" />
            }
            {executing ? 'Running...' : 'Run'}
          </motion.button>

          <div className="h-4 w-px bg-[rgba(255,255,255,0.08)]" />

          {/* Invite */}
          {joinCode ? (
            <div className="flex items-center gap-2 bg-[#111827] border border-[#3b82f6]/25 rounded-lg px-3 py-1.5">
              <span className="text-[9px] text-[#4a5568] uppercase tracking-wider font-bold">Code:</span>
              <span className="text-xs font-bold text-[#60a5fa] tracking-widest font-mono">{joinCode}</span>
              <button
                onClick={copyCode}
                className="ml-1 flex items-center gap-1 text-[10px] bg-[#3b82f6]/15 text-[#60a5fa] hover:bg-[#3b82f6] hover:text-white px-2 py-0.5 rounded-md transition-all"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={generateInvite}
              className="flex items-center gap-1.5 text-xs bg-[#111827] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] text-[#8892b0] hover:text-[#f0f4ff] px-3 py-1.5 rounded-lg transition-all font-medium"
            >
              <Users className="h-3.5 w-3.5" /> Invite
            </motion.button>
          )}

          <div className="h-4 w-px bg-[rgba(255,255,255,0.08)]" />

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { logout(); navigate('/login'); }}
            title="Logout"
            className="p-1.5 text-[#2d3748] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </nav>

      {/* ─── BODY ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <AnimatePresence initial={false}>
          {leftOpen && (
            <motion.div
              key="left-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="border-r border-[rgba(255,255,255,0.04)] bg-[#0c1220] flex flex-col shrink-0 overflow-hidden"
            >
              {treeLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <Loader2 className="h-5 w-5 text-[#3b82f6] animate-spin" />
                </div>
              ) : (
                <FileExplorer
                  files={files}
                  activeFileId={activeFileId}
                  selectedFolderId={selectedFolder}
                  setSelectedFolderId={setSelectedFolder}
                  onFileClick={handleFileClick}
                  newItemType={newItemType}
                  setNewItemType={setNewItemType}
                  newItemName={newItemName}
                  setNewItemName={setNewItemName}
                  handleNewItemSubmit={handleNewItemSubmit}
                  handleNewItemKeyDown={handleNewItemKeyDown}
                  onCreateFile={() => { setNewItemType('file'); setNewItemName(''); }}
                  onCreateFolder={() => { setNewItemType('folder'); setNewItemName(''); }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CENTER */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#070b14]">

          {/* Tabs */}
          <EditorTabs
            openFiles={openFiles}
            files={files}
            activeFileId={activeFileId}
            onSelect={setActiveFileId}
            onClose={handleCloseFile}
          />

          {/* Editor area */}
          <div className="flex-1 min-h-0 relative">
            {activeFileId ? (
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontLigatures: true,
                  lineHeight: 22,
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderLineHighlight: 'gutter',
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true, indentation: true },
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  },
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center select-none">
                <motion.div
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                >
                  <Code2 className="h-16 w-16 text-[#1a2340] mb-4 mx-auto" />
                </motion.div>
                <p className="text-[#2d3748] text-sm font-medium">Select a file to start editing</p>
                <p className="text-[#1a2340] text-xs mt-1">or create a new file in the Explorer</p>
              </div>
            )}

            {/* Save toast */}
            <AnimatePresence>
              {saveToast && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30 px-5 py-2.5 rounded-full backdrop-blur-md shadow-xl"
                >
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-semibold">Auto-saved to database</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Output / Terminal */}
          <OutputPanel
            isOpen={bottomOpen}
            onClose={() => setBottomOpen(false)}
            activeTab={bottomTab}
            setActiveTab={setBottomTab}
            output={output}
            isExecuting={executing}
            onClear={() => setOutput('')}
          />
        </div>

        {/* RIGHT SIDEBAR */}
        <AnimatePresence initial={false}>
          {rightOpen && (
            <motion.div
              key="right-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="border-l border-[rgba(255,255,255,0.04)] bg-[#0c1220] flex flex-col shrink-0 overflow-hidden"
            >
              <ChatPanel
                messages={chatMessages}
                input={chatInput}
                setInput={setChatInput}
                onSend={sendChat}
                currentUser={user?.username || user?.email}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── STATUS BAR (VSCode-style) ─── */}
      <div className="h-[22px] bg-[#3b82f6] flex items-center px-4 gap-4 text-[10px] font-medium text-white shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
          <span>Connected</span>
        </div>
        <span className="opacity-40">|</span>
        <span>{language.charAt(0).toUpperCase() + language.slice(1)}</span>
        {activeFile && (
          <>
            <span className="opacity-40">|</span>
            <span>{activeFile.name}</span>
          </>
        )}
        <div className="ml-auto">
          <span>CodeSync IDE</span>
        </div>
      </div>
    </div>
  );
}
