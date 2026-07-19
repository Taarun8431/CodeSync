import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useAuth } from '../contexts/AuthContext';
import { Code2, Share2, MessageSquare, Play, FolderTree, FileJson, LogOut, Users, Check } from 'lucide-react';
import api from '../utils/api';

export default function Workspace() {
  const { projectId } = useParams();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatArray, setChatArray] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Execution Engine States
  const [language, setLanguage] = useState('javascript');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState('');

  // Setup Yjs for Chat
  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:5000/api/v1/collaboration', 
      `project-${projectId}`, 
      doc,
      { params: { token } }
    );

    const ychat = doc.getArray('chat');
    setChatArray(ychat);

    ychat.observe(() => {
      setChatMessages(ychat.toArray());
    });
    
    // Initial load
    setChatMessages(ychat.toArray());

    return () => provider.destroy();
  }, [projectId, token]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Connect Editor to a specific file (hardcoded to a test file for now, but should be dynamic based on VFS selection)
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:5000/api/v1/collaboration',
      `test-file-${projectId}`, // Ideally, this would be a real fileId from VFS
      doc,
      { params: { token } }
    );
    const type = doc.getText('monaco');
    new MonacoBinding(type, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatArray) return;
    
    chatArray.push([{
      user: user.username || user.email,
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
    <div className="h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden">
      {/* Top Navbar */}
      <nav className="h-14 border-b border-[#334155] flex items-center justify-between px-4 shrink-0 bg-[#1e293b]">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="hover:text-brand-500 transition-colors"><Code2 className="h-6 w-6 text-brand-500"/></Link>
          <span className="font-semibold text-sm">CodeSync Editor</span>
        </div>
        <div className="flex items-center gap-3">
          {joinCode ? (
            <div className="flex items-center gap-2 bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5">
              <span className="text-xs text-gray-400">Join Code:</span>
              <span className="text-xs font-bold text-brand-400 tracking-widest">{joinCode}</span>
              <button 
                onClick={copyToClipboard}
                className="text-[10px] bg-brand-500/20 text-brand-400 hover:bg-brand-500 hover:text-white px-2 py-0.5 rounded transition-colors ml-1 flex items-center gap-1"
              >
                {copied ? <Check className="h-3 w-3" /> : 'Copy'}
              </button>
            </div>
          ) : (
            <button onClick={generateShareLink} className="text-xs bg-[#1e293b] border border-[#334155] hover:bg-[#334155] px-3 py-1.5 rounded flex items-center gap-2 transition-colors">
              <Users className="h-3 w-3" /> Invite Members
            </button>
          )}
          
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#0f172a] border border-[#334155] text-xs text-gray-300 rounded px-2 py-1.5 focus:outline-none"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
          </select>

          <button 
            onClick={handleRunCode}
            disabled={isExecuting}
            className={`text-xs px-4 py-1.5 rounded flex items-center gap-2 transition-colors ${isExecuting ? 'bg-gray-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            <Play className="h-3 w-3" /> {isExecuting ? 'Running...' : 'Run Code'}
          </button>
          
          <div className="h-4 w-px bg-[#334155] mx-2"></div>
          
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className="text-xs hover:bg-red-500/10 hover:text-red-500 text-gray-400 p-1.5 rounded transition-colors" 
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - File Tree */}
        <div className="w-64 border-r border-[#334155] bg-[#0f172a] flex flex-col">
          <div className="p-3 border-b border-[#334155] text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <FolderTree className="h-4 w-4" /> Explorer
          </div>
          <div className="p-2 flex-1 overflow-y-auto text-sm">
            {/* Fake VFS for now */}
            <div className="flex items-center gap-2 p-1.5 hover:bg-[#1e293b] rounded cursor-pointer text-brand-400 bg-[#1e293b]">
              <FileJson className="h-4 w-4" /> index.js
            </div>
          </div>
        </div>

        {/* Center - Monaco Editor & Terminal */}
        <div className="flex-1 flex flex-col relative bg-[#1e1e1e] min-w-0">
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                padding: { top: 16 }
              }}
            />
          </div>
          
          {/* Terminal Output Panel */}
          <div className="h-56 bg-[#0f172a] border-t border-[#334155] flex flex-col">
            <div className="px-4 py-2 bg-[#1e293b] border-b border-[#334155] text-xs font-bold text-gray-400 flex justify-between items-center shrink-0">
              <span>EXECUTION OUTPUT</span>
              {executionOutput && (
                <button onClick={() => setExecutionOutput('')} className="text-gray-500 hover:text-brand-400 transition-colors">
                  Clear
                </button>
              )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap break-words">
              {executionOutput ? (
                <span className={executionOutput.includes('Error') || executionOutput.includes('failed') ? 'text-red-400' : 'text-gray-300'}>
                  {executionOutput}
                </span>
              ) : (
                <span className="text-gray-600">Run your code to see the output here...</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        <div className="w-80 border-l border-[#334155] bg-[#1e293b] flex flex-col">
          <div className="p-3 border-b border-[#334155] text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Team Chat
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse">
            {chatMessages.slice().reverse().map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.user === (user?.username || user?.email) ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-500 mb-1">{msg.user}</span>
                <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${msg.user === (user?.username || user?.email) ? 'bg-brand-500 text-white rounded-br-none' : 'bg-[#334155] text-gray-200 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendChat} className="p-3 border-t border-[#334155] bg-[#0f172a]">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
