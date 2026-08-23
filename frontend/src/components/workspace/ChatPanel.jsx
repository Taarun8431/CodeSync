import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';

function getInitials(name = '') {
  return name.slice(0, 2).toUpperCase() || '??';
}

function getAvatarColor(name = '') {
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e',
    '#f59e0b', '#06b6d4', '#ef4444', '#a855f7',
  ];
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % colors.length;
  return colors[hash];
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ messages, input, setInput, onSend, currentUser }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.04)] bg-[#0c1220]">
        <div className="bg-[#8b5cf6]/15 p-1.5 rounded-lg">
          <MessageSquare className="h-3.5 w-3.5 text-[#a78bfa]" />
        </div>
        <span className="text-[11px] font-bold text-[#4a5568] uppercase tracking-widest">Team Chat</span>
        <div className="ml-auto w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-3">
            <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded-2xl">
              <MessageSquare className="h-8 w-8 text-[#2d3748]" />
            </div>
            <div>
              <p className="text-sm text-[#374151] font-medium">No messages yet</p>
              <p className="text-xs text-[#2d3748] mt-1">Start the conversation!</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.user === currentUser;
          const color = getAvatarColor(msg.user);

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Sender + time */}
              <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {getInitials(msg.user)}
                </div>
                <span className="text-[10px] text-[#374151]">{msg.user}</span>
                <span className="text-[9px] text-[#2d3748]">{formatTime(msg.timestamp)}</span>
              </div>

              {/* Bubble */}
              <div
                className={`
                  px-3 py-2 rounded-2xl text-[13px] max-w-[85%] leading-relaxed break-words shadow-sm
                  ${isMe
                    ? 'bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white rounded-tr-sm'
                    : 'bg-[#151d35] border border-[rgba(255,255,255,0.05)] text-[#c9d1e0] rounded-tl-sm'
                  }
                `}
              >
                {msg.text}
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={onSend}
        className="p-3 border-t border-[rgba(255,255,255,0.04)] bg-[#0c1220]"
      >
        <div className="flex items-center gap-2 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-xl px-3 py-2 focus-within:border-[#3b82f6]/50 transition-colors">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message the team..."
            className="flex-1 bg-transparent text-[13px] text-[#f0f4ff] placeholder:text-[#2d3748] focus:outline-none"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg bg-[#3b82f6] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
