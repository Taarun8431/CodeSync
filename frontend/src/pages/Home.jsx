import { Moon, Sun, Code2, Users, Rocket, Zap, Server, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home({ theme, toggleTheme }) {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-brand-500/30">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 glass-card border-b-0 rounded-none border-x-0 !bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-brand-500 p-2 rounded-lg">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">CodeSync</span>
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link to="/login" className="text-sm font-medium hover:text-brand-500 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary flex items-center gap-2">
                Get Started <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 text-sm font-medium mb-8 animate-fade-in">
          <Zap className="h-4 w-4" /> Code with your team in real-time
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl">
          The Collaborative IDE <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
            For Next-Gen Teams
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mb-10">
          Build, execute, and ship code faster with real-time multiplayer editing, isolated execution containers, and instant chat.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/register" className="btn-primary text-lg px-8 py-4 flex justify-center items-center gap-2">
            Start Coding Free <Rocket className="h-5 w-5" />
          </Link>
          <a href="#features" className="btn-secondary text-lg px-8 py-4 flex justify-center items-center">
            Explore Features
          </a>
        </div>

        {/* Hero Image Mockup */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl overflow-hidden glass-card shadow-2xl shadow-brand-500/10 border-[var(--border-color)] relative">
          <div className="h-10 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center px-4 gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
            <div className="mx-auto text-xs text-[var(--text-muted)] font-mono">index.js — CodeSync</div>
          </div>
          <div className="p-8 bg-[#0d1117] text-left overflow-x-auto min-h-[400px]">
            <pre className="font-mono text-sm text-gray-300">
              <span className="text-brand-400">import</span> {'{'} <span className="text-blue-300">createServer</span> {'}'} <span className="text-brand-400">from</span> <span className="text-green-300">'http'</span>;<br/><br/>
              <span className="text-brand-400">const</span> server = <span className="text-blue-300">createServer</span>((req, res) ={'>'} {'{'}<br/>
              {'  '}res.<span className="text-blue-300">writeHead</span>(<span className="text-purple-400">200</span>, {'{'} <span className="text-green-300">'Content-Type'</span>: <span className="text-green-300">'text/plain'</span> {'}'});<br/>
              {'  '}res.<span className="text-blue-300">end</span>(<span className="text-green-300">'Hello from CodeSync Multiplayer!\n'</span>);<br/>
              {'}'});<br/><br/>
              server.<span className="text-blue-300">listen</span>(<span className="text-purple-400">3000</span>, () ={'>'} {'{'}<br/>
              {'  '}console.<span className="text-blue-300">log</span>(<span className="text-green-300">'Server running...'</span>);<br/>
              {'}'});
            </pre>
            {/* Fake multiplayer cursors */}
            <div className="absolute top-24 left-32">
              <div className="h-5 w-[2px] bg-red-500 animate-pulse"></div>
              <div className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-r rounded-bl absolute top-full left-0 whitespace-nowrap">Alice</div>
            </div>
            <div className="absolute top-44 left-64">
              <div className="h-5 w-[2px] bg-brand-500 animate-pulse"></div>
              <div className="bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded-r rounded-bl absolute top-full left-0 whitespace-nowrap">Bob</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to build software</h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto">CodeSync combines an ultra-fast collaborative editor with isolated execution containers.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-8 hover:border-brand-500/50 transition-colors">
              <div className="bg-brand-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-brand-500">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Multiplayer</h3>
              <p className="text-[var(--text-muted)]">Experience zero-latency collaboration powered by Yjs CRDTs. See your team's cursors and chat in real-time.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-card p-8 hover:border-brand-500/50 transition-colors">
              <div className="bg-brand-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-brand-500">
                <Server className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Isolated Execution</h3>
              <p className="text-[var(--text-muted)]">Run your code instantly. Our backend provisions ephemeral Docker containers to securely execute scripts in isolation.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-card p-8 hover:border-brand-500/50 transition-colors">
              <div className="bg-brand-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-brand-500">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">VSCode in Browser</h3>
              <p className="text-[var(--text-muted)]">Powered by the Monaco Editor, get full syntax highlighting, IntelliSense, and auto-completion right in your browser.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
