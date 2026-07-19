import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Folder, Plus, LogOut, Code2, Users, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      const wsList = wsRes.data.data.workspaces || [];
      setWorkspaces(wsList);
      
      if (wsList.length > 0) {
        const projRes = await api.get(`/projects?workspaceId=${wsList[0].id}`);
        setProjects(projRes.data.data.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    const name = prompt('Workspace Name:');
    if (!name) return;
    try {
      await api.post('/workspaces', { name });
      fetchData();
    } catch (err) { alert('Failed'); }
  };

  const handleCreateProject = async () => {
    if (workspaces.length === 0) return alert('Create a workspace first');
    const name = prompt('Project Name:');
    if (!name) return;
    try {
      await api.post('/projects', { name, workspaceId: workspaces[0].id });
      fetchData();
    } catch (err) { alert('Failed'); }
  };

  const handleJoinProject = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      await api.post('/projects/join', { joinCode });
      setJoinCode('');
      fetchData();
      alert('Successfully joined!');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid join code');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-brand-500" /></div>;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <nav className="glass-card border-x-0 border-t-0 rounded-none px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-brand-500 p-1.5 rounded-lg"><Code2 className="h-5 w-5 text-white" /></div>
          <span className="font-bold text-lg">CodeSync</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--text-muted)]">{user?.email}</span>
          <button onClick={handleLogout} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors" title="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar - Join & Workspaces */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-brand-500"/> Join via Code</h3>
            <form onSubmit={handleJoinProject} className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. X7YB9Z" 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-sm focus:outline-none focus:border-brand-500 uppercase"
              />
              <button type="submit" className="btn-primary py-2 px-3 text-sm">Join</button>
            </form>
          </div>

          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Workspaces</h3>
              <button onClick={handleCreateWorkspace} className="text-brand-500 hover:bg-brand-500/10 p-1 rounded"><Plus className="h-4 w-4"/></button>
            </div>
            {workspaces.map(w => (
              <div key={w.id} className="py-2 flex items-center gap-2 text-sm font-medium text-[var(--text-main)] bg-[var(--border-color)]/20 px-3 rounded-md mb-2">
                <Folder className="h-4 w-4 text-brand-500" /> {w.name}
              </div>
            ))}
            {workspaces.length === 0 && <div className="text-sm text-[var(--text-muted)]">No workspaces yet.</div>}
          </div>
        </div>

        {/* Main Content - Projects */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recent Projects</h2>
            <button onClick={handleCreateProject} className="btn-primary flex items-center gap-2 py-2">
              <Plus className="h-4 w-4"/> New Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(p => (
              <Link to={`/workspace/${p.id}`} key={p.id} className="glass-card p-5 hover:border-brand-500/50 hover:shadow-brand-500/10 transition-all group block">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-brand-500/10 p-3 rounded-lg text-brand-500 group-hover:scale-110 transition-transform"><Code2 className="h-6 w-6"/></div>
                  {p.isPublic && <span className="text-[10px] uppercase font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded-full">Public</span>}
                </div>
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4 truncate">{p.description || 'No description provided.'}</p>
                <div className="flex justify-between items-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border-color)]">
                  <span>Updated just now</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3"/> Collaboration</span>
                </div>
              </Link>
            ))}
            {projects.length === 0 && workspaces.length > 0 && (
              <div className="col-span-full py-12 text-center text-[var(--text-muted)] border-2 border-dashed border-[var(--border-color)] rounded-xl">
                Create a project to start coding!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
