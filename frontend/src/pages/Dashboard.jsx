import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Folder, Plus, LogOut, Code2, Users, Loader2, Activity, ChevronRight, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Simple Modal Component
const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0b1326]/90 backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]"></div>
          <div className="flex justify-between items-center mb-6 mt-2">
            <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
            <button onClick={onClose} className="text-[#8c909f] hover:text-white bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] p-1.5 rounded-lg transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  
  // Selection state
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);

  // Modals state
  const [isWorkspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      const wsList = wsRes.data.data.workspaces || [];
      setWorkspaces(wsList);
      
      const projRes = await api.get(`/projects`);
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
      setWorkspaceModalOpen(false);
      fetchData();
    } catch (err) { alert('Failed to create workspace'); }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const wsId = selectedWorkspaceId || (workspaces.length > 0 ? workspaces[0].id : null);
    if (!wsId) return alert('Create a workspace first');
    if (!newItemName.trim()) return;
    try {
      await api.post('/projects', { name: newItemName, workspaceId: wsId });
      setNewItemName('');
      setProjectModalOpen(false);
      fetchData();
    } catch (err) { alert('Failed to create project'); }
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter projects by selected workspace
  const filteredProjects = useMemo(() => {
    if (!selectedWorkspaceId) return projects;
    // Attempt to filter by workspaceId (assuming backend returns it, fallback to showing all if property doesn't exist)
    return projects.filter(p => p.workspaceId === selectedWorkspaceId || !p.workspaceId);
  }, [projects, selectedWorkspaceId]);

  const selectedWorkspaceName = workspaces.find(w => w.id === selectedWorkspaceId)?.name;

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 className="h-10 w-10 text-[#3b82f6]" />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-[#dae2fd] font-['Inter'] selection:bg-[#3b82f6]/30 overflow-hidden relative">
      
      {/* Background Glow Effects (Lumina Collaborative) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[50%] h-[50%] rounded-full bg-[#3b82f6] opacity-[0.05] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#8b5cf6] opacity-[0.05] blur-[120px]" />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="backdrop-blur-[20px] bg-[#0b1326]/60 border-b border-[rgba(255,255,255,0.05)] px-8 py-4 flex justify-between items-center sticky top-0 z-20"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="bg-[#3b82f6] p-2 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Code2 className="h-5 w-5 text-white" />
          </motion.div>
          <span className="font-bold text-xl text-white tracking-tight group-hover:text-[#3b82f6] transition-colors">CodeSync</span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 bg-[#171f33]/50 px-4 py-2 rounded-full border border-[rgba(255,255,255,0.05)]">
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-sm font-medium text-[#8c909f]">{user?.email}</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout} 
            className="p-2 hover:bg-red-500/10 text-[#8c909f] hover:text-red-500 rounded-xl transition-colors" 
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Join via Code */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-[#0b1326]/60 border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-[#8c909f]">
              <div className="bg-[#3b82f6]/10 p-1.5 rounded-lg text-[#3b82f6]"><Users className="h-4 w-4"/></div>
              Join Collaboration
            </h3>
            <form onSubmit={handleJoinProject} className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="e.g. X7YB9Z" 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl bg-[#171f33]/50 border border-[rgba(255,255,255,0.05)] text-sm focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] uppercase transition-all placeholder:text-[#424754]"
              />
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2.5 px-4 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all flex justify-center"
              >
                Join Workspace
              </motion.button>
            </form>
          </motion.div>

          {/* Workspaces */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-[#0b1326]/60 border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 shadow-xl flex flex-col min-h-[300px]"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8c909f] flex items-center gap-2">
                <div className="bg-[#8b5cf6]/10 p-1.5 rounded-lg text-[#8b5cf6]"><Folder className="h-4 w-4"/></div>
                Workspaces
              </h3>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setNewItemName(''); setWorkspaceModalOpen(true); }} 
                className="text-[#3b82f6] hover:text-white bg-[#3b82f6]/10 hover:bg-[#3b82f6] p-1.5 rounded-lg transition-all"
                title="New Workspace"
              >
                <Plus className="h-4 w-4"/>
              </motion.button>
            </div>
            
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              <motion.div 
                onClick={() => setSelectedWorkspaceId(null)}
                className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${!selectedWorkspaceId ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30' : 'bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.03)]'}`}
              >
                <Folder className={`h-4 w-4 transition-colors ${!selectedWorkspaceId ? 'text-[#3b82f6] fill-[#3b82f6]/20' : 'text-[#8c909f] group-hover:text-[#dae2fd]'}`} />
                <span className={`text-sm font-medium transition-colors ${!selectedWorkspaceId ? 'text-white' : 'text-[#8c909f] group-hover:text-white'}`}>All Projects</span>
              </motion.div>

              {workspaces.map((w, idx) => {
                const isSelected = selectedWorkspaceId === w.id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.05) }}
                    key={w.id} 
                    onClick={() => setSelectedWorkspaceId(w.id)}
                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30' : 'bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.03)]'}`}
                  >
                    <Folder className={`h-4 w-4 transition-colors ${isSelected ? 'text-[#8b5cf6] fill-[#8b5cf6]/20' : 'text-[#8c909f] group-hover:text-[#dae2fd]'}`} />
                    <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-white' : 'text-[#8c909f] group-hover:text-white'}`}>{w.name}</span>
                  </motion.div>
                );
              })}
              
              {workspaces.length === 0 && (
                <div className="text-xs text-[#424754] text-center py-6 border border-dashed border-[rgba(255,255,255,0.05)] rounded-xl mt-4">
                  No folders created yet.
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Main Content - Projects */}
        <div className="lg:col-span-3">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
          >
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-1 flex items-center gap-3">
                {selectedWorkspaceId ? (
                  <>
                    <button onClick={() => setSelectedWorkspaceId(null)} className="text-[#8c909f] hover:text-white transition-colors">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    {selectedWorkspaceName}
                  </>
                ) : 'All Projects'}
              </h2>
              <p className="text-sm text-[#8c909f]">{selectedWorkspaceId ? 'Projects in this workspace' : 'Continue where you left off'}</p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setNewItemName(''); setProjectModalOpen(true); }} 
              className="bg-[#3b82f6] text-white flex items-center gap-2 py-2.5 px-5 rounded-xl font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all whitespace-nowrap"
            >
              <Plus className="h-4 w-4"/> New Project
            </motion.button>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredProjects.map(p => (
              <motion.div key={p.id} variants={fadeInUp} className="h-full">
                <Link to={`/workspace/${p.id}`} className="block h-full">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="h-full backdrop-blur-xl bg-[#0b1326]/60 border border-[rgba(255,255,255,0.05)] hover:border-[#3b82f6]/50 rounded-2xl p-6 transition-all shadow-xl hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] group flex flex-col relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3b82f6]/0 via-[#3b82f6]/0 to-[#3b82f6]/0 group-hover:from-[#3b82f6] group-hover:to-[#8b5cf6] transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-[#171f33] p-3 rounded-xl text-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                        <Activity className="h-5 w-5"/>
                      </div>
                      {p.isPublic && (
                        <span className="text-[9px] uppercase font-bold tracking-widest bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1 rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-lg text-white mb-2 group-hover:text-[#3b82f6] transition-colors">{p.name}</h3>
                    <p className="text-sm text-[#8c909f] mb-6 line-clamp-2 flex-grow">
                      {p.description || 'No description provided. Click to open the workspace and start collaborating.'}
                    </p>
                    
                    <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-wider text-[#424754] pt-4 border-t border-[rgba(255,255,255,0.05)]">
                      <span>Updated recently</span>
                      <span className="flex items-center gap-1 text-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                        Open <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
            
            {filteredProjects.length === 0 && (
              <motion.div 
                variants={fadeInUp}
                className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-[#0b1326]/30 border border-dashed border-[rgba(255,255,255,0.1)] rounded-3xl backdrop-blur-sm"
              >
                <div className="bg-[#3b82f6]/10 p-5 rounded-full mb-4 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Code2 className="h-8 w-8 text-[#3b82f6]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No projects found</h3>
                <p className="text-[#8c909f] mb-6 max-w-sm text-sm">
                  {selectedWorkspaceId ? "This workspace doesn't have any projects yet." : "Create your first project to start collaborating with your team."}
                </p>
                <button 
                  onClick={() => { setNewItemName(''); setProjectModalOpen(true); }} 
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                >
                  Create Project
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isWorkspaceModalOpen} 
        onClose={() => setWorkspaceModalOpen(false)} 
        title="Create Workspace"
      >
        <form onSubmit={handleCreateWorkspace}>
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c909f] mb-2">Workspace Name</label>
            <input 
              type="text" 
              autoFocus
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#171f33]/50 border border-[rgba(255,255,255,0.05)] text-white focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#424754]"
              placeholder="e.g. Personal Projects"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setWorkspaceModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#8c909f] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isProjectModalOpen} 
        onClose={() => setProjectModalOpen(false)} 
        title="Create Project"
      >
        <form onSubmit={handleCreateProject}>
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8c909f] mb-2">Project Name</label>
            <input 
              type="text" 
              autoFocus
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#171f33]/50 border border-[rgba(255,255,255,0.05)] text-white focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder:text-[#424754]"
              placeholder="e.g. Authentication API"
            />
            <p className="text-xs text-[#424754] mt-3 bg-[rgba(255,255,255,0.02)] p-2.5 rounded-lg border border-[rgba(255,255,255,0.02)]">
              Will be created in <strong className="text-[#8c909f]">{selectedWorkspaceId ? selectedWorkspaceName : (workspaces.length > 0 ? workspaces[0].name : 'a workspace')}</strong>.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#8c909f] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
