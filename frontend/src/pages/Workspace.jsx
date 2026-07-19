import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useAuth } from '../contexts/AuthContext';
import { Code2, Share2, MessageSquare, Play, FolderTree, FileJson } from 'lucide-react';
import api from '../utils/api';

export default function Workspace() {
  const { projectId } = useParams();
  const { token, user } = useAuth();
  const editorRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatArray, setChatArray] = useState(null);
  const [shareLink, setShareLink] = useState('');

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
      setShareLink(res.data.data.whatsappLink);
    } catch (err) { alert('Failed to generate link'); }
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
          {shareLink ? (
            <a href={shareLink} target="_blank" className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded flex items-center gap-2">
              <Share2 className="h-3 w-3" /> WhatsApp Link
            </a>
          ) : (
            <button onClick={generateShareLink} className="text-xs bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded flex items-center gap-2 transition-colors">
              <Share2 className="h-3 w-3" /> Share Project
            </button>
          )}
          <button className="text-xs bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 rounded flex items-center gap-2 transition-colors">
            <Play className="h-3 w-3" /> Run Code
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

        {/* Center - Monaco Editor */}
        <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
          <Editor
            height="100%"
            defaultLanguage="javascript"
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
