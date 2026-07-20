import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useAuth } from '../contexts/AuthContext';
import { Code2, Share2, MessageSquare, Play, FolderTree, FileJson, LogOut, Users, Check, Plus, FolderPlus, FilePlus, X, PanelLeft, PanelRight, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Workspace() {
  const { projectId } = useParams();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  
  // Layout states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [saveNotification, setSaveNotification] = useState(false);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);

  // Chat States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatArray, setChatArray] = useState(null);
  
  // Collab States
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // File System States
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeVersion, setTreeVersion] = useState(0);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/vfs/tree`);
        const { folders, files } = res.data.data;
        // Combine them into a single array mapping to the UI format
        const formattedFolders = folders.map(f => ({ ...f, type: 'folder' }));
        const formattedFiles = files.map(f => ({ ...f, type: 'file' }));
        const allItems = [...formattedFolders, ...formattedFiles];
        setFiles(allItems);
        
        // Auto-open first file if any
        if (formattedFiles.length > 0) {
          setActiveFileId(formattedFiles[0].id);
          setOpenFiles([formattedFiles[0].id]);
        }
      } catch (err) {
        console.error('Failed to load VFS tree', err);
      } finally {
        setTreeLoading(false);
      }
    };
    fetchTree();
  }, [projectId, treeVersion]);

  // Inline Create States
  const [newItemType, setNewItemType] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  
  // Execution Engine States
  const [language, setLanguage] = useState('javascript');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState('');
  const [activeBottomTab, setActiveBottomTab] = useState('output'); // 'output' or 'terminal'

  // Current active file helper
  const activeFile = files.find(f => f.id === activeFileId);

  // Yjs Provider reference
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const [treeEventsMap, setTreeEventsMap] = useState(null);

  useEffect(() => {
    // Connect Chat
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:5000/api/v1/collaboration', 
      `project-${projectId}-chat`, 
      doc,
      { params: { token } }
    );

    const ychat = doc.getArray('chat');
    setChatArray(ychat);

    ychat.observe(() => {
      setChatMessages(ychat.toArray());
    });
    
    setChatMessages(ychat.toArray());

    const yTree = doc.getMap('treeEvents');
    setTreeEventsMap(yTree);

    yTree.observe(() => {
      // Trigger a re-fetch of the tree whenever any client updates the map
      setTreeVersion(v => v + 1);
    });

    return () => provider.destroy();
  }, [projectId, token]);

  const [monacoInstance, setMonacoInstance] = useState(null);
  const modelsRef = useRef({}); // Store monaco models by fileId

  // Handle Editor Mount & Yjs Binding
  const handleEditorMount = async (editor, monaco) => {
    editorRef.current = editor;
    setMonacoInstance(monaco);

    if (activeFileId && !modelsRef.current[activeFileId]) {
      try {
        const res = await api.get(`/projects/${projectId}/vfs/files/${activeFileId}`);
        const f = res.data.data.file;
        modelsRef.current[activeFileId] = monaco.editor.createModel(f.content || '', f.language || 'plaintext', monaco.Uri.file(`${f.id}-${f.name}`));
        editor.setModel(modelsRef.current[activeFileId]);
        bindEditor(activeFileId);
      } catch (err) {
        console.error('Failed to fetch initial file content', err);
      }
    } else if (activeFileId && modelsRef.current[activeFileId]) {
      editor.setModel(modelsRef.current[activeFileId]);
      bindEditor(activeFileId);
    }
  };

  const bindEditor = (fileId) => {
    if (!editorRef.current) return;
    
    // Cleanup previous binding
    if (bindingRef.current) bindingRef.current.destroy();
    if (providerRef.current) providerRef.current.destroy();

    const doc = new Y.Doc();
    providerRef.current = new WebsocketProvider(
      'ws://localhost:5000/api/v1/collaboration',
      `${fileId}`, 
      doc,
      { params: { token } }
    );
    
    const type = doc.getText('monaco');
    bindingRef.current = new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), providerRef.current.awareness);

    const yNotif = doc.getMap('notifications');
    yNotif.observe((event) => {
      if (event.keysChanged.has('lastSaved')) {
        setSaveNotification(true);
        setTimeout(() => setSaveNotification(false), 3000);
      }
    });
  };

  // Re-bind and swap model when active file changes
  useEffect(() => {
    const loadModelAndBind = async () => {
      if (editorRef.current && monacoInstance && activeFileId) {
        if (!modelsRef.current[activeFileId]) {
          try {
            const res = await api.get(`/projects/${projectId}/vfs/files/${activeFileId}`);
            const f = res.data.data.file;
            modelsRef.current[activeFileId] = monacoInstance.editor.createModel(f.content || '', f.language || 'plaintext', monacoInstance.Uri.file(`${f.id}-${f.name}`));
          } catch (err) {
            console.error('Failed to load file content', err);
            return;
          }
        }
        // Swap the editor to the new model (preserves cursor, undo history, and text)
        editorRef.current.setModel(modelsRef.current[activeFileId]);
        bindEditor(activeFileId);
      }
    };
    loadModelAndBind();
  }, [activeFileId, monacoInstance, projectId]);

  const handleCreateFile = () => {
    setNewItemType('file');
    setNewItemName('');
  };

  const handleCreateFolder = () => {
    setNewItemType('folder');
    setNewItemName('');
  };

  const inferLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      'js': 'javascript', 'jsx': 'javascript',
      'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'java': 'java',
      'cpp': 'cpp', 'c': 'cpp',
      'go': 'go',
      'md': 'markdown'
    };
    return map[ext] || 'plaintext';
  };

  const handleNewItemSubmit = async () => {
    if (!newItemName.trim()) {
      setNewItemType(null);
      return;
    }
    
    const isFile = newItemType === 'file';
    const name = newItemName.trim();
    
    try {
      if (isFile) {
        const lang = inferLanguage(name);
        const res = await api.post(`/projects/${projectId}/vfs/files`, { 
          name, 
          language: lang,
          folderId: selectedFolderId 
        });
        const newFile = { ...res.data.data.file, type: 'file' };
        setFiles(prev => [...prev, newFile]);
        setOpenFiles(prev => [...prev, newFile.id]);
        setActiveFileId(newFile.id);
      } else {
        const res = await api.post(`/projects/${projectId}/vfs/folders`, { 
          name,
          parentId: selectedFolderId
        });
        const newFolder = { ...res.data.data.folder, type: 'folder' };
        setFiles(prev => [...prev, newFolder]);
      }
      
      // Broadcast update to all other clients to refresh their trees
      if (treeEventsMap) {
        treeEventsMap.set('lastUpdate', Date.now());
      }
    } catch (err) {
      console.error('Failed to create item', err);
      alert('Failed to create: ' + (err.response?.data?.message || err.message));
    }
    
    setNewItemType(null);
    setNewItemName('');
  };

  const handleNewItemKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNewItemSubmit();
    } else if (e.key === 'Escape') {
      setNewItemType(null);
      setNewItemName('');
    }
  };

  const handleFileClick = (fileId) => {
    if (!openFiles.includes(fileId)) setOpenFiles([...openFiles, fileId]);
    setActiveFileId(fileId);
  };

  const handleCloseFile = (e, fileId) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(id => id !== fileId);
    setOpenFiles(newOpenFiles);
    if (activeFileId === fileId) {
      setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatArray) return;
    
    chatArray.push([{
      user: user?.username || user?.email || 'Unknown',
      text: chatInput,
      timestamp: Date.now()
    }]);
    setChatInput('');
  };

  const generateShareLink = async () => {
    try {
      const res = await api.post(`/projects/${projectId}/share`);
      setJoinCode(res.data.data.joinCode);
    } catch (err) { alert('Failed to generate invite code'); }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    
    setBottomPanelOpen(true);
    setActiveBottomTab('output');
    setIsExecuting(true);
    setExecutionOutput('Executing code in secure container...\n');
    
    try {
      const res = await api.post(`/projects/${projectId}/execute`, {
        code,
        language
      });
      const { run } = res.data.data;
      
      let output = '';
      if (run.stderr) output += `${run.stderr}\n`;
      if (run.stdout) output += run.stdout;
      
      setExecutionOutput(output || 'Program exited cleanly with no output.');
    } catch (err) {
      setExecutionOutput(err.response?.data?.message || 'Execution failed due to a server error.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-[#dae2fd] overflow-hidden font-['Inter'] selection:bg-[#3b82f6]/30">
      
      {/* Top Navbar */}
      <nav className="h-14 border-b border-[rgba(255,255,255,0.05)] bg-[#0b1326] flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 group mr-2">
            <div className="bg-[#3b82f6] p-1.5 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-transform">
              <Code2 className="h-5 w-5 text-white"/>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center text-[13px] font-medium text-[#c2c6d6]">
            <div className="relative group cursor-pointer px-3 py-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors">
              File
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#0b1326]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
                <div onClick={handleCreateFile} className="px-4 py-2 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] transition-colors">New File</div>
                <div onClick={handleCreateFolder} className="px-4 py-2 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] transition-colors">New Folder</div>
                <div className="h-px bg-[rgba(255,255,255,0.05)] my-1"></div>
                <div onClick={() => navigate('/dashboard')} className="px-4 py-2 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] transition-colors">Close Workspace</div>
              </div>
            </div>
            <div className="relative group cursor-pointer px-3 py-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors">
              Edit
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#0b1326]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
                <div className="px-4 py-2 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] transition-colors flex justify-between text-[#8c909f] cursor-not-allowed">Undo <span className="text-[10px]">Ctrl+Z</span></div>
                <div className="px-4 py-2 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] transition-colors flex justify-between text-[#8c909f] cursor-not-allowed">Redo <span className="text-[10px]">Ctrl+Y</span></div>
              </div>
            </div>
            <div className="relative group cursor-pointer px-3 py-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-colors">
              View
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#0b1326]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
                <div onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className="px-4 py-2 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] transition-colors flex justify-between items-center">Explorer {leftSidebarOpen && <Check className="h-3 w-3"/>}</div>
                <div onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className="px-4 py-2 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] transition-colors flex justify-between items-center">Chat {rightSidebarOpen && <Check className="h-3 w-3"/>}</div>
                <div onClick={() => setBottomPanelOpen(!bottomPanelOpen)} className="px-4 py-2 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] transition-colors flex justify-between items-center">Terminal {bottomPanelOpen && <Check className="h-3 w-3"/>}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Search / Command Palette (Mock) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none hidden lg:flex">
          <div className="flex items-center gap-2 bg-[#171f33]/50 border border-[rgba(255,255,255,0.05)] rounded-lg px-4 py-1.5 w-[350px] text-[11px] text-[#8c909f]">
            <span>🔍 Search files or run commands (Ctrl+P)</span>
          </div>
        </div>

        {/* Right Side: Run Controls & User Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#171f33] border border-[rgba(255,255,255,0.1)] text-xs font-medium text-[#dae2fd] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3b82f6] transition-colors"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
            </select>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRunCode}
              disabled={isExecuting}
              className={`text-xs px-4 py-1.5 rounded-lg font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-colors ${isExecuting ? 'bg-[#424754] text-[#c2c6d6] cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
            >
              {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3 w-3 fill-current" />} 
              {isExecuting ? 'Running...' : 'Run'}
            </motion.button>
          </div>
          
          <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]"></div>

          {joinCode ? (
            <div className="flex items-center gap-2 bg-[#171f33] border border-[#3b82f6]/30 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-[#8c909f] uppercase tracking-wider font-semibold">Join Code:</span>
              <span className="text-xs font-bold text-[#3b82f6] tracking-widest">{joinCode}</span>
              <button 
                onClick={copyToClipboard}
                className="text-[10px] bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white px-2 py-0.5 rounded transition-colors ml-1 flex items-center gap-1"
              >
                {copied ? <Check className="h-3 w-3" /> : 'Copy'}
              </button>
            </div>
          ) : (
            <button onClick={generateShareLink} className="text-xs bg-[#171f33] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors font-medium">
              <Users className="h-3 w-3" /> Invite
            </button>
          )}
          
          <div className="h-4 w-px bg-[rgba(255,255,255,0.1)] mx-2"></div>
          
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className="text-xs hover:bg-red-500/10 hover:text-red-500 text-[#8c909f] p-1.5 rounded-lg transition-colors" 
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar - File Explorer */}
        <AnimatePresence initial={false}>
          {leftSidebarOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-[rgba(255,255,255,0.05)] bg-[#0b1326] flex flex-col shrink-0"
            >
              <div className="p-3 flex justify-between items-center text-[10px] font-bold text-[#8c909f] uppercase tracking-wider">
                <span>Explorer</span>
                <div className="flex gap-1">
                  <button onClick={handleCreateFile} className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded-md text-[#dae2fd] transition-colors" title="New File"><FilePlus className="h-3.5 w-3.5"/></button>
                  <button onClick={handleCreateFolder} className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded-md text-[#dae2fd] transition-colors" title="New Folder"><FolderPlus className="h-3.5 w-3.5"/></button>
                </div>
              </div>
              <div 
                className="p-2 flex-1 overflow-y-auto text-sm space-y-0.5 pb-20"
                onClick={() => setSelectedFolderId(null)}
              >
                {(() => {
                  const renderTree = (parentId = null, depth = 0) => {
                    const nodeFolders = files.filter(f => f.type === 'folder' && (f.parentId || null) === parentId);
                    const nodeFiles = files.filter(f => f.type === 'file' && (f.folderId || null) === parentId);
                    
                    return (
                      <>
                        {nodeFolders.map(folder => (
                          <div key={folder.id}>
                            <div 
                              onClick={(e) => { e.stopPropagation(); setSelectedFolderId(folder.id); }}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${selectedFolderId === folder.id ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-[#c2c6d6] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#dae2fd]'}`}
                              style={{ paddingLeft: `${depth * 12 + 8}px` }}
                            >
                              <FolderTree className="h-4 w-4 text-[#8b5cf6] shrink-0"/>
                              <span className="truncate text-[13px]">{folder.name}</span>
                            </div>
                            {renderTree(folder.id, depth + 1)}
                          </div>
                        ))}
                        {nodeFiles.map(file => (
                          <div 
                            key={file.id}
                            onClick={(e) => { e.stopPropagation(); handleFileClick(file.id); }}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${activeFileId === file.id ? 'bg-[#3b82f6]/10 text-[#3b82f6]' : 'text-[#c2c6d6] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#dae2fd]'}`}
                            style={{ paddingLeft: `${depth * 12 + 8}px` }}
                          >
                            <FileJson className="h-4 w-4 opacity-70 shrink-0"/>
                            <span className="truncate text-[13px]">{file.name}</span>
                          </div>
                        ))}
                        {newItemType && selectedFolderId === parentId && (
                          <div 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[rgba(255,255,255,0.05)] border border-[#3b82f6]/30"
                            style={{ paddingLeft: `${depth * 12 + 8}px` }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {newItemType === 'folder' ? <FolderTree className="h-4 w-4 text-[#8b5cf6] shrink-0"/> : <FileJson className="h-4 w-4 opacity-70 shrink-0"/>}
                            <input 
                              autoFocus
                              type="text" 
                              value={newItemName}
                              onChange={e => setNewItemName(e.target.value)}
                              onKeyDown={handleNewItemKeyDown}
                              onBlur={() => { if(!newItemName.trim()) setNewItemType(null); }}
                              className="bg-transparent text-[13px] text-white focus:outline-none w-full"
                            />
                          </div>
                        )}
                      </>
                    );
                  };
                  return renderTree(null, 0);
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center - Editor & Bottom Panel */}
        <div className="flex-1 flex flex-col bg-[#020617] min-w-0">
          
          {/* Editor Tabs */}
          <div className="flex bg-[#0b1326] overflow-x-auto border-b border-[rgba(255,255,255,0.02)] hide-scrollbar">
            {openFiles.map(fileId => {
              const f = files.find(x => x.id === fileId);
              if (!f) return null;
              return (
                <div 
                  key={fileId} 
                  onClick={() => setActiveFileId(fileId)}
                  className={`group flex items-center justify-between gap-2 px-4 py-2 border-r border-[rgba(255,255,255,0.02)] min-w-[120px] max-w-[200px] cursor-pointer text-sm transition-colors ${activeFileId === fileId ? 'bg-[#171f33] text-[#3b82f6] border-t-2 border-t-[#3b82f6]' : 'bg-transparent text-[#8c909f] border-t-2 border-t-transparent hover:bg-[rgba(255,255,255,0.02)]'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileJson className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate text-[13px] font-medium">{f.name}</span>
                  </div>
                  <button 
                    onClick={(e) => handleCloseFile(e, fileId)} 
                    className={`p-1 rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors ${activeFileId === fileId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Monaco Editor */}
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
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth"
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-[#8c909f] bg-[#020617]">
                <div className="text-center">
                  <Code2 className="h-12 w-12 mx-auto opacity-20 mb-4" />
                  <p>Select a file to start editing</p>
                </div>
              </div>
            )}
          </div>

        {/* Save Notification Toast */}
        <AnimatePresence>
          {saveNotification && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md shadow-lg z-50"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Code automatically saved to DB</span>
            </motion.div>
          )}
        </AnimatePresence>

          
          {/* Bottom Terminal Panel */}
          <AnimatePresence initial={false}>
            {bottomPanelOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 250, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0b1326] border-t border-[rgba(255,255,255,0.05)] flex flex-col shrink-0"
              >
                <div className="flex items-center px-4 bg-[#171f33]/50 border-b border-[rgba(255,255,255,0.02)]">
                  <button 
                    onClick={() => setActiveBottomTab('output')}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors ${activeBottomTab === 'output' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#8c909f] hover:text-[#dae2fd]'}`}
                  >
                    Output
                  </button>
                  <button 
                    onClick={() => setActiveBottomTab('terminal')}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors ${activeBottomTab === 'terminal' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#8c909f] hover:text-[#dae2fd]'}`}
                  >
                    Terminal
                  </button>
                  <div className="flex-1 flex justify-end">
                    <button onClick={() => setBottomPanelOpen(false)} className="text-[#8c909f] hover:text-white p-1 rounded-md transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto font-['JetBrains_Mono'] text-sm whitespace-pre-wrap break-words bg-[#020617] relative shadow-inner">
                  {activeBottomTab === 'output' && (
                    <>
                      {executionOutput ? (
                        <span className={executionOutput.includes('Error') || executionOutput.includes('failed') ? 'text-red-400' : 'text-[#dae2fd]'}>
                          {executionOutput}
                        </span>
                      ) : (
                        <span className="text-[#424754]">Run your code to see the output here...</span>
                      )}
                      {executionOutput && (
                        <button onClick={() => setExecutionOutput('')} className="absolute top-2 right-4 text-xs text-[#8c909f] hover:text-[#dae2fd] bg-[#171f33] border border-[rgba(255,255,255,0.05)] px-2 py-1 rounded transition-colors">
                          Clear
                        </button>
                      )}
                    </>
                  )}
                  {activeBottomTab === 'terminal' && (
                    <div className="text-[#dae2fd]">
                      <span className="text-green-400">user@codesync</span>:<span className="text-blue-400">~/project</span>$ <span className="animate-pulse">_</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Chat */}
        <AnimatePresence initial={false}>
          {rightSidebarOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-[rgba(255,255,255,0.05)] bg-[#0b1326] flex flex-col shrink-0"
            >
              <div className="p-3 border-b border-[rgba(255,255,255,0.02)] text-[10px] font-bold uppercase tracking-wider text-[#8c909f] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-[#8b5cf6]" /> Team Chat
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse bg-[rgba(255,255,255,0.01)]">
                {chatMessages.slice().reverse().map((msg, i) => {
                  const isMe = msg.user === (user?.username || user?.email);
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-[#8c909f] mb-1 px-1">{msg.user}</span>
                      <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] shadow-sm ${isMe ? 'bg-[#3b82f6] text-white rounded-br-none' : 'bg-[#171f33] border border-[rgba(255,255,255,0.05)] text-[#dae2fd] rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  )
                })}
                {chatMessages.length === 0 && (
                  <div className="text-center text-sm text-[#424754] my-auto">
                    Start the conversation!
                  </div>
                )}
              </div>

              <form onSubmit={sendChat} className="p-3 border-t border-[rgba(255,255,255,0.02)] bg-[#171f33]/50">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-[#0b1326] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#424754]"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
