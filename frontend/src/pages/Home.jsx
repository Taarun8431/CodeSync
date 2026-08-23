import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code2, Users, Zap, Server, ChevronRight, ArrowRight,
  Rocket, Globe, Shield, GitBranch, Terminal, CheckCircle2, Play, MessageSquare
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';

/* ─── Animation helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ─── Features ─── */
const features = [
  {
    icon: Users,
    title: 'Real-time Multiplayer',
    desc: 'Zero-latency collaboration via Yjs CRDTs. See your teammates\' cursors move live — just like Google Docs, but for code.',
    accent: '#3b82f6',
    glow: 'rgba(59,130,246,0.2)',
    tag: 'Collaboration',
  },
  {
    icon: Server,
    title: 'Isolated Execution',
    desc: 'Every run spins up an ephemeral Docker container. Fully sandboxed, instant, and secure — supporting 10+ languages.',
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.2)',
    tag: 'Execution Engine',
  },
  {
    icon: Code2,
    title: 'Monaco Editor',
    desc: 'The same engine that powers VS Code — full IntelliSense, syntax highlighting, and auto-completion in your browser.',
    accent: '#8b5cf6',
    glow: 'rgba(139,92,246,0.2)',
    tag: 'Editor',
  },
  {
    icon: GitBranch,
    title: 'Project Workspaces',
    desc: 'Organize code into workspaces and projects. Invite collaborators with a single join code.',
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.2)',
    tag: 'Organization',
  },
  {
    icon: MessageSquare,
    title: 'Built-in Team Chat',
    desc: 'In-editor real-time chat powered by Yjs. No need to context-switch to Slack mid-code-review.',
    accent: '#ec4899',
    glow: 'rgba(236,72,153,0.2)',
    tag: 'Communication',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    desc: 'JWT auth, refresh tokens, and per-container isolation. Your code never runs in a shared environment.',
    accent: '#06b6d4',
    glow: 'rgba(6,182,212,0.2)',
    tag: 'Security',
  },
];

/* Real tech stack used in this project */
const techStack = [
  { label: 'Yjs CRDTs',       desc: 'Conflict-free real-time sync',      color: '#3b82f6', icon: Users },
  { label: 'Docker Sandbox',  desc: 'Ephemeral container execution',      color: '#22c55e', icon: Terminal },
  { label: 'Monaco Editor',   desc: 'VS Code engine in the browser',      color: '#8b5cf6', icon: Code2 },
  { label: 'JWT + Refresh',   desc: 'Stateless auth with token rotation', color: '#f59e0b', icon: Shield },
  { label: 'WebSocket / Y-WS',desc: 'Persistent collaborative sessions',  color: '#ec4899', icon: GitBranch },
  { label: 'REST API',        desc: 'Express + Prisma + PostgreSQL',       color: '#06b6d4', icon: Server },
];

const codeLines = [
  { content: ['import', ' { createServer } ', 'from', " 'http';"], colors: ['#c792ea', '#f0f4ff', '#c792ea', '#c3e88d'] },
  { content: [''], colors: [''] },
  { content: ['const', ' server = ', 'createServer', '((req, res) => {'], colors: ['#c792ea', '#f0f4ff', '#82aaff', '#f0f4ff'] },
  { content: ['  res.', 'writeHead', '(200, { '], colors: ['#f0f4ff', '#82aaff', '#f0f4ff'] },
  { content: ["    'Content-Type'", ': ', "'text/plain'"], colors: ['#c3e88d', '#f0f4ff', '#c3e88d'] },
  { content: ['  });'], colors: ['#f0f4ff'] },
  { content: ['  res.', 'end', "('Hello from CodeSync!');"], colors: ['#f0f4ff', '#82aaff', '#c3e88d'] },
  { content: ['});'], colors: ['#f0f4ff'] },
  { content: [''], colors: [''] },
  { content: ['server.', 'listen', '(3000, () => {'], colors: ['#f0f4ff', '#82aaff', '#f0f4ff'] },
  { content: ["  console.", 'log', "('🚀 Server live on port 3000');"], colors: ['#f0f4ff', '#82aaff', '#c3e88d'] },
  { content: ['});'], colors: ['#f0f4ff'] },
];

export default function Home({ theme, toggleTheme }) {
  return (
    <div className="min-h-screen bg-[#070b14] text-[#f0f4ff] overflow-x-hidden">
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-70" />

        {/* Glow orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[#3b82f6] opacity-[0.06] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#8b5cf6] opacity-[0.06] blur-[130px] pointer-events-none" />
        <div className="absolute top-[30%] right-[15%] w-[20%] h-[30%] rounded-full bg-[#22c55e] opacity-[0.03] blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — text */}
            <div className="text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#60a5fa] text-sm font-semibold mb-8"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                />
                Real-time collaborative coding platform
                <ChevronRight className="h-4 w-4 opacity-60" />
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-[3.8rem] lg:text-[4.2rem] font-extrabold tracking-tight leading-[1.1] mb-6"
              >
                Code together,{' '}
                <span className="relative">
                  <span className="gradient-text">ship faster</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full origin-left"
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-[#8892b0] max-w-xl mb-10 leading-relaxed"
              >
                A multiplayer IDE with real-time collaboration, isolated Docker execution,
                Monaco editor, and team chat — all in one browser tab.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(59,130,246,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white px-8 py-4 rounded-xl font-semibold text-base shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-shadow"
                  >
                    <Rocket className="h-4.5 w-4.5" />
                    Start Coding Free
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </Link>
                <a href="#features">
                  <motion.button
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.07)' }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f0f4ff] px-8 py-4 rounded-xl font-semibold text-base backdrop-blur-sm transition-all"
                  >
                    <Play className="h-4 w-4 text-[#8892b0]" />
                    Explore Features
                  </motion.button>
                </a>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 mt-10"
              >
                {['No credit card', 'Free forever plan', 'Open source'].map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-[#4a5568]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — animated code window */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="animate-float"
            >
              <div className="relative">
                {/* Outer glow */}
                <div className="absolute -inset-1 bg-gradient-to-br from-[#3b82f6]/30 to-[#8b5cf6]/30 rounded-2xl blur-xl opacity-60" />

                {/* Window chrome */}
                <div className="relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-[#0c1220] border-b border-[rgba(255,255,255,0.06)]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                      <div className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                      <div className="w-3 h-3 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-[11px] text-[#4a5568] font-mono">server.js — CodeSync Workspace</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#22c55e]/10 border border-[#22c55e]/20 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                      <span className="text-[9px] text-[#4ade80] font-bold uppercase tracking-wider">3 online</span>
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="bg-[#070b14] p-6 font-mono text-sm relative overflow-hidden min-h-[340px]">
                    {/* Line numbers */}
                    <div className="flex gap-5">
                      <div className="flex flex-col gap-[3px] text-[#2d3748] text-right select-none text-[12px] leading-[1.75]">
                        {codeLines.map((_, i) => (
                          <span key={i}>{i + 1}</span>
                        ))}
                      </div>
                      <div className="flex flex-col gap-[3px] flex-1 text-[12px] leading-[1.75]">
                        {codeLines.map((line, li) => (
                          <div key={li}>
                            {line.content.map((seg, si) => (
                              <span key={si} style={{ color: line.colors[si] || '#f0f4ff' }}>{seg}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Animated cursors */}
                    <motion.div
                      animate={{ x: [0, 24, 10, 35, 0], y: [0, -12, 6, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                      className="absolute top-[90px] left-[120px] z-20 pointer-events-none"
                    >
                      <div className="h-[18px] w-[2px] bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
                      <div className="bg-[#ef4444] text-white text-[9px] font-bold px-2 py-0.5 rounded-r-md rounded-bl-md whitespace-nowrap shadow-lg absolute top-full left-0">Alice</div>
                    </motion.div>
                    <motion.div
                      animate={{ x: [0, -24, -10, -32, 0], y: [0, 20, 8, 25, 0] }}
                      transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut', delay: 1.5 }}
                      className="absolute top-[160px] left-[200px] z-20 pointer-events-none"
                    >
                      <div className="h-[18px] w-[2px] bg-[#8b5cf6] shadow-[0_0_6px_rgba(139,92,246,0.9)]" />
                      <div className="bg-[#8b5cf6] text-white text-[9px] font-bold px-2 py-0.5 rounded-r-md rounded-bl-md whitespace-nowrap shadow-lg absolute top-full left-0">Bob</div>
                    </motion.div>
                    <motion.div
                      animate={{ x: [0, 14, 28, 5, 0], y: [0, 30, 15, 40, 0] }}
                      transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 3 }}
                      className="absolute top-[220px] left-[160px] z-20 pointer-events-none"
                    >
                      <div className="h-[18px] w-[2px] bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.9)]" />
                      <div className="bg-[#22c55e] text-white text-[9px] font-bold px-2 py-0.5 rounded-r-md rounded-bl-md whitespace-nowrap shadow-lg absolute top-full left-0">Carol</div>
                    </motion.div>
                  </div>

                  {/* Status bar */}
                  <div className="flex items-center gap-4 px-4 py-1.5 bg-[#3b82f6] text-[10px] font-medium text-white">
                    <span>JavaScript</span>
                    <span className="opacity-60">·</span>
                    <span>UTF-8</span>
                    <span className="opacity-60">·</span>
                    <span>LF</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span>Ln 11, Col 3</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[11px] text-[#2d3748] uppercase tracking-widest font-semibold">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            className="w-5 h-8 border border-[rgba(255,255,255,0.1)] rounded-full flex justify-center pt-1.5"
          >
            <div className="w-1 h-1.5 bg-[#3b82f6] rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── TECH STACK ─── */}
      <section className="py-20 border-y border-[rgba(255,255,255,0.05)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-[#0c1220] to-[#070b14]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-[11px] font-bold text-[#2d3748] uppercase tracking-widest mb-3">Built with production-grade technology</p>
            <h3 className="text-2xl font-bold text-white">The real stack under the hood</h3>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map(({ label, desc, color, icon: Icon }, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.07)}
                whileHover={{ y: -4, borderColor: `${color}40` }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group flex flex-col items-center text-center p-5 rounded-2xl bg-[#0c1220] border border-[rgba(255,255,255,0.05)] cursor-default transition-colors"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <p className="text-[13px] font-bold text-[#f0f4ff] mb-1">{label}</p>
                <p className="text-[11px] text-[#4a5568] leading-snug">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div {...fadeUp()} className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#a78bfa] text-sm font-semibold mb-6">
              <Zap className="h-3.5 w-3.5" />
              Everything you need
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Built for teams that{' '}
              <span className="gradient-text">move fast</span>
            </h2>
            <p className="text-[#8892b0] text-lg max-w-2xl mx-auto">
              Every tool your team needs to write, run, and review code — without leaving the browser.
            </p>
          </motion.div>

          {/* Cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={i}
                  {...fadeUp(i * 0.08)}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group relative p-7 rounded-2xl bg-[#0c1220] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-colors overflow-hidden cursor-default"
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${feat.glow}, transparent 70%)` }}
                  />

                  {/* Tag */}
                  <div className="flex justify-between items-start mb-5">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${feat.accent}15`, border: `1px solid ${feat.accent}25` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: feat.accent }} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#2d3748] group-hover:text-[#4a5568] transition-colors">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-[17px] font-bold text-white mb-3 group-hover:text-[#f8faff] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-[#4a5568] text-sm leading-relaxed group-hover:text-[#8892b0] transition-colors">
                    {feat.desc}
                  </p>

                  {/* Bottom accent line */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-0 left-0 right-0 h-[2px] origin-left"
                    style={{ background: `linear-gradient(90deg, ${feat.accent}, transparent)` }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 bg-[#0c1220]/50 border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
              Get started in <span className="gradient-text">30 seconds</span>
            </h2>
            <p className="text-[#8892b0]">No setup, no config, no installs.</p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            {[
              { step: '01', title: 'Create an account', desc: 'Sign up free — no credit card required.', icon: Rocket },
              { step: '02', title: 'Start a project', desc: 'Create a workspace and invite your team with a join code.', icon: Globe },
              { step: '03', title: 'Write & run code', desc: 'Edit collaboratively and execute code in any language instantly.', icon: Terminal },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  {...fadeUp(i * 0.12)}
                  className="flex-1 relative"
                >
                  {/* Connector line */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-7 left-[calc(100%_+_8px)] w-[calc(100%_-_16px)] h-px bg-gradient-to-r from-[rgba(255,255,255,0.08)] to-transparent z-10" />
                  )}

                  <div className="p-7 rounded-2xl bg-[#0c1220] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(59,130,246,0.3)] transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl font-black text-[#1a2340] group-hover:text-[#2d3748] transition-colors tabular-nums shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-[#3b82f6]" />
                          <h3 className="font-bold text-white">{item.title}</h3>
                        </div>
                        <p className="text-sm text-[#4a5568]">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 via-transparent to-[#8b5cf6]/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#3b82f6]/5 blur-[100px] pointer-events-none" />

        <motion.div
          {...fadeUp()}
          className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#60a5fa] text-sm font-semibold mb-8">
            <Zap className="h-3.5 w-3.5" />
            Open source internship project
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Built to code{' '}
            <span className="gradient-text">together</span>
          </h2>
          <p className="text-[#8892b0] text-lg mb-10 leading-relaxed">
            CodeSync is a full-stack collaborative IDE built with Yjs, Docker, Monaco Editor,
            and WebSockets — designed to demonstrate real-world engineering.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(59,130,246,0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white px-9 py-4 rounded-xl font-bold text-base shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-shadow"
              >
                <Zap className="h-4.5 w-4.5" />
                Get Started — It's Free
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.07)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#f0f4ff] px-9 py-4 rounded-xl font-semibold text-base backdrop-blur-sm transition-all"
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[rgba(255,255,255,0.05)] bg-[#070b14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-2 rounded-xl shadow-lg">
                  <Code2 className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">Code<span className="text-[#3b82f6]">Sync</span></span>
              </div>
              <p className="text-sm text-[#4a5568] max-w-xs leading-relaxed">
                The collaborative IDE for teams who want to write, run, and review code — together.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              {[
                { title: 'Product', links: ['Features', 'Pricing', 'Changelog'] },
                { title: 'Company', links: ['About', 'Blog', 'Careers'] },
                { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
              ].map(col => (
                <div key={col.title}>
                  <p className="text-[#f0f4ff] font-semibold mb-3">{col.title}</p>
                  {col.links.map(l => (
                    <a key={l} href="#" className="block text-[#4a5568] hover:text-[#8892b0] transition-colors mb-2">
                      {l}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.05)] mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#2d3748]">© 2026 CodeSync. All rights reserved.</p>
            <p className="text-xs text-[#2d3748]">Built with ❤️ for developers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
