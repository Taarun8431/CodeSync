import { Moon, Sun, Code2, Users, Rocket, Zap, Server, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home({ theme, toggleTheme }) {
  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] selection:bg-[#3b82f6]/30 overflow-hidden font-['Inter']">
      
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#3b82f6] opacity-10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#8b5cf6] opacity-10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed w-full z-50 backdrop-blur-[12px] bg-[#171f33]/80 border-b border-[rgba(255,255,255,0.05)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="bg-[#3b82f6] p-2 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              >
                <Code2 className="h-6 w-6 text-white" />
              </motion.div>
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-[#3b82f6] transition-colors">CodeSync</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[#dae2fd]"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.button>
              <Link to="/login" className="text-sm font-medium hover:text-[#3b82f6] transition-colors">
                Sign In
              </Link>
              <Link to="/register">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
                >
                  Get Started <ChevronRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 text-sm font-medium mb-8 backdrop-blur-md"
        >
          <Zap className="h-4 w-4 text-[#3b82f6]" /> Code with your team in real-time
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl text-white"
        >
          The Collaborative IDE <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]">
            For Next-Gen Teams
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl text-[#8c909f] max-w-2xl mb-10"
        >
          Build, execute, and ship code faster with real-time multiplayer editing, isolated execution containers, and instant chat.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link to="/register">
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(59,130,246,0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#3b82f6] text-white text-lg px-8 py-4 rounded-xl font-medium flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
            >
              Start Coding Free <Rocket className="h-5 w-5" />
            </motion.button>
          </Link>
          <a href="#features">
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#171f33] border border-[rgba(255,255,255,0.1)] text-[#dae2fd] text-lg px-8 py-4 rounded-xl font-medium flex justify-center items-center backdrop-blur-md transition-all"
            >
              Explore Features
            </motion.button>
          </a>
        </motion.div>

        {/* Hero Image Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl shadow-[#3b82f6]/20 border border-[rgba(255,255,255,0.1)] relative backdrop-blur-[12px] bg-[#0b1326]/60"
        >
          <div className="h-10 bg-[#171f33]/80 border-b border-[rgba(255,255,255,0.05)] flex items-center px-4 gap-2 backdrop-blur-md">
            <div className="h-3 w-3 rounded-full bg-red-500/80 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500/80 shadow-[0_0_5px_rgba(234,179,8,0.5)]"></div>
            <div className="h-3 w-3 rounded-full bg-green-500/80 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
            <div className="mx-auto text-xs text-[#8c909f] font-mono">index.js — CodeSync</div>
          </div>
          <div className="p-8 text-left overflow-x-auto min-h-[400px] font-['JetBrains_Mono'] relative">
            <pre className="text-sm leading-loose text-[#dae2fd]">
              <span className="text-[#8b5cf6]">import</span> {'{'} <span className="text-[#3b82f6]">createServer</span> {'}'} <span className="text-[#8b5cf6]">from</span> <span className="text-[#22c55e]">'http'</span>;<br/><br/>
              <span className="text-[#8b5cf6]">const</span> server = <span className="text-[#3b82f6]">createServer</span>((req, res) ={'>'} {'{'}<br/>
              {'  '}res.<span className="text-[#3b82f6]">writeHead</span>(<span className="text-[#eab308]">200</span>, {'{'} <span className="text-[#22c55e]">'Content-Type'</span>: <span className="text-[#22c55e]">'text/plain'</span> {'}'});<br/>
              {'  '}res.<span className="text-[#3b82f6]">end</span>(<span className="text-[#22c55e]">'Hello from CodeSync Multiplayer!\n'</span>);<br/>
              {'}'});<br/><br/>
              server.<span className="text-[#3b82f6]">listen</span>(<span className="text-[#eab308]">3000</span>, () ={'>'} {'{'}<br/>
              {'  '}console.<span className="text-[#3b82f6]">log</span>(<span className="text-[#22c55e]">'Server running...'</span>);<br/>
              {'}'});
            </pre>
            {/* Fake multiplayer cursors */}
            <motion.div 
              animate={{ x: [0, 20, 10, 30, 0], y: [0, -10, -5, -15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute top-24 left-32 z-20"
            >
              <div className="h-5 w-[2px] bg-[#ef4444] shadow-[0_0_5px_rgba(239,68,68,1)]"></div>
              <div className="bg-[#ef4444] text-white text-[10px] px-2 py-0.5 rounded-r rounded-bl absolute top-full left-0 whitespace-nowrap shadow-lg">Alice</div>
            </motion.div>
            <motion.div 
              animate={{ x: [0, -30, -15, -40, 0], y: [0, 20, 10, 25, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
              className="absolute top-44 left-64 z-20"
            >
              <div className="h-5 w-[2px] bg-[#3b82f6] shadow-[0_0_5px_rgba(59,130,246,1)]"></div>
              <div className="bg-[#3b82f6] text-white text-[10px] px-2 py-0.5 rounded-r rounded-bl absolute top-full left-0 whitespace-nowrap shadow-lg">Bob</div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative z-10 border-t border-[rgba(255,255,255,0.05)] bg-[#0b1326]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Everything you need to build software</h2>
            <p className="text-[#8c909f] max-w-2xl mx-auto">CodeSync combines an ultra-fast collaborative editor with isolated execution containers.</p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: Users, title: "Real-time Multiplayer", desc: "Experience zero-latency collaboration powered by Yjs CRDTs. See your team's cursors and chat in real-time." },
              { icon: Server, title: "Isolated Execution", desc: "Run your code instantly. Our backend provisions ephemeral Docker containers to securely execute scripts in isolation." },
              { icon: Code2, title: "VSCode in Browser", desc: "Powered by the Monaco Editor, get full syntax highlighting, IntelliSense, and auto-completion right in your browser." }
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -10, borderColor: "rgba(59,130,246,0.5)" }}
                className="p-8 rounded-2xl backdrop-blur-[12px] bg-[#171f33]/60 border border-[rgba(255,255,255,0.05)] transition-colors shadow-lg"
              >
                <div className="bg-[#3b82f6]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-[#3b82f6]">
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feat.title}</h3>
                <p className="text-[#8c909f] leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
}
