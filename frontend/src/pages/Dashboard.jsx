import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FolderOpen, Plus, LogOut, Code2, Users, Activity,
  ChevronRight, X, Search, Clock, Globe, Lock, Hash,
  LayoutDashboard, Settings, Bell, Zap, GitBranch
} from 'lucide-react';
import { PageSpinner } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

/* ─── Language color map ─── */
const langColors = {
  javascript: '#f59e0b',
  typescript: '#3b82f6',
  python:     '#22c55e',
  java:       '#ef4444',
  cpp:        '#8b5cf6',
  go:         '#06b6d4',
  rust:       '#f97316',
};

/* ─── Random lang for demo (since no lang in project data) ─── */
const langs = Object.keys(langColors);
function projectColor(name = '') {
  const idx = Math.abs(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % langs.length;
  return langColors[langs[idx]];
}

function timeAgo(isoStr) {
  if (!isoStr) return 'Recently';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getInitials(str = '') {
  return str.slice(0, 2).toUpperCase();
}

/* ─── Project Card ─── */
function ProjectCard({ project }) {
  const color  = projectColor(project.name);
  const edited = timeAgo(project.updatedAt);

  return (
    <Link to={`/workspace/${project.id}`} className="block group">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative h-full bg-[#0c1220] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] rounded-2xl overflow-hidden flex flex-col transition-colors"
      >
        {/* Color bar */}
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(circle at 50% 0%, ${color}10, transparent 60%)` }}
        />

        <div className="p-6 flex flex-col flex-1 relative">
          {/* Icon + badge */}
          <div className="flex items-start justify-between mb-5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
              style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
            >
              <Activity className="h-5 w-5" style={{ color }} />
            </div>
            {project.isPublic ? (
              <Badge variant="green" dot>Public</Badge>
            ) : (
              <Badge variant="gray"><Lock className="h-2.5 w-2.5 mr-1" />Private</Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-[#f0f4ff] text-[16px] mb-2 group-hover:text-white transition-colors line-clamp-1">
            {project.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-[#4a5568] leading-relaxed mb-6 flex-1 line-clamp-2">
            {project.description || 'Click to open and start collaborating with your team.'}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.04)] text-xs text-[#2d3748]">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {edited}
            </div>
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-[#3b82f6] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Open <ChevronRight className="h-3 w-3" />
            </motion.span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ─── Empty state ─── */
function EmptyState({ onNew, filtered }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center">
          <Code2 className="h-9 w-9 text-[#3b82f6] opacity-60" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-3xl border border-[#3b82f6]/30"
        />
      </div>
      <h3 className="text-xl font-bold text-[#f0f4ff] mb-2">
        {filtered ? 'No matching projects' : 'No projects yet'}
      </h3>
      <p className="text-[#4a5568] text-sm mb-8 max-w-xs">
        {filtered
          ? 'Try a different search term or clear the filter.'
          : 'Create your first project to start collaborating.'}
      </p>
      {!filtered && (
        <Button onClick={onNew} size="md" icon={<Plus className="h-4 w-4" />}>
          Create Project
        </Button>
      )}
    </motion.div>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [joinCode,   setJoinCode]   = useState('');

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);

  const [wsModalOpen,   setWsModalOpen]   = useState(false);
  const [projModalOpen, setProjModalOpen] = useState(false);
  const [newItemName,   setNewItemName]   = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [wsRes, projRes] = await Promise.all([
        api.get('/workspaces'),
        api.get('/projects'),
      ]);
      setWorkspaces(wsRes.data.data.workspaces || []);
      setProjects(projRes.data.data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      await api.post('/workspaces', { name: newItemName });
      setNewItemName('');
      setWsModalOpen(false);
      fetchData();
    } catch { alert('Failed to create workspace'); }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const wsId = selectedWorkspaceId || (workspaces[0]?.id ?? null);
    if (!wsId) return alert('Create a workspace first');
    if (!newItemName.trim()) return;
    try {
      await api.post('/projects', { name: newItemName, workspaceId: wsId });
      setNewItemName('');
      setProjModalOpen(false);
      fetchData();
    } catch { alert('Failed to create project'); }
  };

  const handleJoinProject = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      await api.post('/projects/join', { code: joinCode });
      setJoinCode('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid join code');
    }
  };

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (selectedWorkspaceId) {
      list = list.filter(p => p.workspaceId === selectedWorkspaceId || !p.workspaceId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    return list;
  }, [projects, selectedWorkspaceId, search]);

  if (loading) return <PageSpinner text="Loading your workspace..." />;

  const avatarChar = (user?.username || user?.email || 'U')[0].toUpperCase();
  const selectedWsName = workspaces.find(w => w.id === selectedWorkspaceId)?.name;

  return (
    <div className="min-h-screen bg-[#070b14] text-[#f0f4ff] font-['Inter'] flex">
      {/* ─── LEFT SIDEBAR ─── */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-64 shrink-0 border-r border-[rgba(255,255,255,0.05)] bg-[#0c1220] flex flex-col h-screen sticky top-0"
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.05)]">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#3b82f6] rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-2 rounded-xl">
                <Code2 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <span className="font-bold text-base text-white">Code<span className="text-[#3b82f6]">Sync</span></span>
              <p className="text-[9px] text-[#2d3748] uppercase tracking-widest">Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-0.5">
          {[
            { icon: LayoutDashboard, label: 'All Projects', id: null },
            { icon: Zap,             label: 'Recent',       id: 'recent', disabled: true },
            { icon: GitBranch,       label: 'Shared',       id: 'shared', disabled: true },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => !item.disabled && setSelectedWorkspaceId(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${!item.disabled && item.id === selectedWorkspaceId
                  ? 'bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20'
                  : item.disabled
                    ? 'text-[#2d3748] cursor-not-allowed'
                    : 'text-[#4a5568] hover:text-[#8892b0] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.disabled && <span className="ml-auto text-[9px] text-[#2d3748] uppercase tracking-wider">soon</span>}
            </button>
          ))}
        </nav>

        {/* Workspaces */}
        <div className="px-3 mt-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-bold text-[#2d3748] uppercase tracking-widest">Workspaces</span>
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setNewItemName(''); setWsModalOpen(true); }}
              className="p-1 text-[#2d3748] hover:text-[#8892b0] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
            </motion.button>
          </div>

          <div className="space-y-0.5">
            {workspaces.map((ws, i) => {
              const isSel = selectedWorkspaceId === ws.id;
              return (
                <motion.button
                  key={ws.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedWorkspaceId(isSel ? null : ws.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                    ${isSel
                      ? 'bg-[#8b5cf6]/10 text-[#a78bfa] border border-[#8b5cf6]/20'
                      : 'text-[#4a5568] hover:text-[#8892b0] hover:bg-[rgba(255,255,255,0.04)]'
                    }`}
                >
                  {isSel
                    ? <FolderOpen className="h-4 w-4 shrink-0 text-[#8b5cf6]" />
                    : <Folder     className="h-4 w-4 shrink-0" />
                  }
                  <span className="truncate">{ws.name}</span>
                </motion.button>
              );
            })}

            {workspaces.length === 0 && (
              <div className="px-3 py-4 text-xs text-[#2d3748] text-center">
                <p className="mb-2">No workspaces yet</p>
                <button
                  onClick={() => { setNewItemName(''); setWsModalOpen(true); }}
                  className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors font-medium"
                >
                  + Create one
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Join code */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.05)]">
          <p className="text-[10px] font-bold text-[#2d3748] uppercase tracking-widest mb-2 px-1">
            Join via Code
          </p>
          <form onSubmit={handleJoinProject} className="flex gap-2">
            <input
              type="text"
              placeholder="X7YB9Z"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="flex-1 px-3 py-2 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.07)] text-xs text-white placeholder:text-[#2d3748] focus:outline-none focus:border-[#3b82f6]/50 uppercase font-mono tracking-widest transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-3 py-2 rounded-xl bg-[#3b82f6] text-white text-xs font-bold shrink-0 hover:bg-[#2563eb] transition-colors"
            >
              Join
            </motion.button>
          </form>
        </div>

        {/* User */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.05)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg">
            {avatarChar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#f0f4ff] truncate">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-[#2d3748] truncate">{user?.email}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { logout(); navigate('/login'); }}
            title="Logout"
            className="p-1.5 text-[#2d3748] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="sticky top-0 z-10 bg-[#070b14]/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)] px-8 py-4 flex items-center gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-[#4a5568]">
              <span>Dashboard</span>
              {selectedWsName && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-[#8892b0]">{selectedWsName}</span>
                </>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2d3748]" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64 pl-9 pr-4 py-2 rounded-xl bg-[#111827] border border-[rgba(255,255,255,0.07)] text-sm text-[#f0f4ff] placeholder:text-[#2d3748] focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
            />
          </div>

          <Button
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => { setNewItemName(''); setProjModalOpen(true); }}
          >
            New Project
          </Button>
        </motion.div>

        {/* Content */}
        <div className="p-8">
          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            {[
              { label: 'Total Projects',   value: projects.length,                  icon: Code2,    color: '#3b82f6' },
              { label: 'Workspaces',       value: workspaces.length,                icon: Folder,   color: '#8b5cf6' },
              { label: 'Collaborations',   value: projects.filter(p => p.isPublic).length, icon: Users, color: '#22c55e' },
              { label: 'Active Today',     value: 0,                                icon: Activity, color: '#f59e0b' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="p-5 rounded-2xl bg-[#0c1220] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#4a5568] font-medium">{label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-white tabular-nums">{value}</p>
              </div>
            ))}
          </motion.div>

          {/* Projects heading */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedWsName ? selectedWsName : 'All Projects'}
              </h2>
              <p className="text-sm text-[#4a5568] mt-0.5">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                {search && ` matching "${search}"`}
              </p>
            </div>
            {selectedWorkspaceId && (
              <button
                onClick={() => setSelectedWorkspaceId(null)}
                className="text-sm text-[#4a5568] hover:text-[#8892b0] transition-colors flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> Clear filter
              </button>
            )}
          </motion.div>

          {/* Project grid */}
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            <AnimatePresence>
              {filteredProjects.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredProjects.length === 0 && (
              <EmptyState
                onNew={() => { setNewItemName(''); setProjModalOpen(true); }}
                filtered={search.length > 0 || selectedWorkspaceId !== null}
              />
            )}
          </motion.div>
        </div>
      </main>

      {/* ─── MODALS ─── */}
      <Modal isOpen={wsModalOpen} onClose={() => setWsModalOpen(false)} title="Create Workspace">
        <form onSubmit={handleCreateWorkspace} className="space-y-5">
          <Input
            label="Workspace Name"
            required
            autoFocus
            placeholder="e.g. Personal Projects"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            icon={<Folder className="h-4 w-4" />}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setWsModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" icon={<Plus className="h-4 w-4" />}>Create Workspace</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={projModalOpen} onClose={() => setProjModalOpen(false)} title="Create Project">
        <form onSubmit={handleCreateProject} className="space-y-5">
          <Input
            label="Project Name"
            required
            autoFocus
            placeholder="e.g. Authentication API"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            icon={<Code2 className="h-4 w-4" />}
          />
          <p className="text-xs text-[#4a5568] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-xl px-4 py-3">
            Will be created in{' '}
            <strong className="text-[#8892b0]">
              {selectedWorkspaceId
                ? workspaces.find(w => w.id === selectedWorkspaceId)?.name
                : workspaces[0]?.name ?? 'a workspace'}
            </strong>
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setProjModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" icon={<Plus className="h-4 w-4" />}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
