import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Layout, LogOut, CheckSquare, Users as UsersIcon, Calendar, ClipboardList, BarChart3, Menu, X, Plus, Search, Filter, Camera, CheckCircle2, AlertCircle, Copy, Sun, Moon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, AssignmentStatus } from './types';

// --- THEME ---
type Theme = 'light' | 'dark';
const ThemeContext = React.createContext<{ theme: Theme; toggleTheme: () => void }>({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = React.useState<Theme>(() => {
    const saved = localStorage.getItem('gtask_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    localStorage.setItem('gtask_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
export const useTheme = () => React.useContext(ThemeContext);

// --- LOCAL AUTH ---
const AuthContext = React.createContext<{
  user: any | null;
  role: UserRole | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}>({ user: null, role: null, login: async () => { }, logout: async () => { }, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<any>(null);
  const [role, setRole] = React.useState<UserRole | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('gtask_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setRole(parsedUser.role as UserRole);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao entrar');
    }

    const userData = await res.json();
    setUser(userData);
    setRole(userData.role as UserRole);
    localStorage.setItem('gtask_user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('gtask_user');
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- DATA CONTEXT (Local API) ---
interface DataContextType {
  users: any[];
  checklists: any[];
  assignments: any[];
  refreshData: () => Promise<void>;
  updateUser: (id: string, data: any) => Promise<void>;
  addUser: (data: any) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  updateChecklist: (id: string, data: any) => Promise<void>;
  addChecklist: (data: any) => Promise<void>;
  removeChecklist: (id: string) => Promise<void>;
  updateAssignment: (id: string, data: any) => Promise<void>;
  addAssignment: (data: any) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
}

const DataContext = React.createContext<DataContextType | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [checklists, setChecklists] = React.useState<any[]>([]);
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const { user } = useAuth();

  const refreshData = async () => {
    if (!user) return;
    try {
      const [uRes, cRes, aRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/checklists'),
        fetch('/api/assignments')
      ]);
      setUsers(await uRes.json());
      setChecklists(await cRes.json());
      setAssignments(await aRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  React.useEffect(() => {
    refreshData();
    // Simple polling for "real-time" feel without Firebase
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const addUser = async (data: any) => {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    refreshData();
  };

  const removeUser = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    refreshData();
  };

  const updateUser = async (id: string, data: any) => {
    console.log('Sending update for user', id, data);
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    refreshData();
  };

  const addChecklist = async (data: any) => {
    await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    refreshData();
  };

  const updateChecklist = async (id: string, data: any) => {
    await fetch(`/api/checklists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    refreshData();
  };

  const removeChecklist = async (id: string) => {
    await fetch(`/api/checklists/${id}`, { method: 'DELETE' });
    refreshData();
  };

  const addAssignment = async (data: any) => {
    await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    refreshData();
  };

  const updateAssignment = async (id: string, data: any) => {
    await fetch(`/api/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    refreshData();
  };

  const removeAssignment = async (id: string) => {
    await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
    refreshData();
  };

  return (
    <DataContext.Provider value={{
      users, checklists, assignments, refreshData,
      updateUser, addUser, removeUser,
      updateChecklist, addChecklist, removeChecklist,
      updateAssignment, addAssignment, removeAssignment
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = React.useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

const GTaskLogo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M85 50C85 69.33 69.33 85 50 85C30.67 85 15 69.33 15 50C15 30.67 30.67 15 50 15C60.33 15 69.67 19.33 76 26.33"
      stroke="currentColor"
      strokeWidth="12"
      strokeLinecap="round"
    />
    <path
      d="M50 50H85"
      stroke="currentColor"
      strokeWidth="12"
      strokeLinecap="round"
    />
  </svg>
);

// --- MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden"
          >
            <div className="p-6 border-b border-blue-50 flex justify-between items-center bg-blue-50/30">
              <h2 className="text-xl font-bold text-blue-900">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-xl text-blue-400 transition"><X size={20} /></button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- PROTECTED ROUTE ---
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50">Carregando...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

// --- NAVIGATION ---
interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
          : 'text-blue-600 hover:bg-blue-50'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Navigation = () => {
  const { role, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { to: '/', icon: Layout, label: 'Dashboard', roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR, UserRole.TECHNICIAN] },
    { to: '/checklists', icon: ClipboardList, label: 'Checklists', roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR] },
    { to: '/assignments', icon: Calendar, label: 'Tarefas', roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR, UserRole.TECHNICIAN] },
    { to: '/users', icon: UsersIcon, label: 'Usuários', roles: [UserRole.ADMIN, UserRole.COORDINATOR] },
    { to: '/reports', icon: BarChart3, label: 'Relatórios', roles: [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR] },
  ].filter(link => !link.roles || (role && link.roles.includes(role)));

  return (
    <>
      <div className="lg:hidden h-16 bg-white border-b border-blue-100 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <GTaskLogo className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl text-blue-900 tracking-tight">GTask</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-blue-600 p-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-blue-100 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="hidden lg:flex items-center gap-2 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <GTaskLogo className="text-white" size={24} />
            </div>
            <span className="font-bold text-2xl text-blue-900 tracking-tight">GTask</span>
          </div>

          <nav className="flex-1 space-y-2">
            {navLinks.map(link => (
              <NavItem
                key={link.to}
                to={link.to}
                icon={link.icon}
                label={link.label}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-blue-50">            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                {user?.name?.[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-blue-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-blue-500 uppercase tracking-wider font-bold">{role}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between w-full px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors group"
                title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-500 group-hover:text-blue-600 transition-colors">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </div>
                  <span className="font-medium text-sm">Tema {theme === 'dark' ? 'Claro' : 'Escuro'}</span>
                </div>
              </button>

              <button
                onClick={() => { logout(); setIsOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
              >
                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// --- PAGES ---

const Dashboard = () => {
  const { role, user: currentUser } = useAuth();
  const { checklists, assignments, users } = useData();

  const filteredAssignments = role === UserRole.TECHNICIAN 
    ? assignments.filter(a => a.assignedTo === currentUser?.id)
    : assignments;

  const pending = filteredAssignments.filter(a => a.status === AssignmentStatus.PENDING || a.status === 'in_service' || a.status === 'waiting_part').length;
  const completedToday = filteredAssignments.filter(a => a.status === AssignmentStatus.COMPLETED || a.status === 'approved').length;
  const onlineTechs = users.filter(u => u.role === UserRole.TECHNICIAN).length;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-blue-900">GTask - Painel de Controle</h1>
        <p className="text-blue-500">Bem-vindo, {currentUser?.name}. Acompanhe a operação em tempo real.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={UsersIcon} label="Usuários" value={onlineTechs.toString()} color="blue" />
        <StatCard icon={Calendar} label="Tarefas em Aberto" value={pending.toString()} color="yellow" />
        <StatCard icon={CheckSquare} label="Finalizados Hoje" value={completedToday.toString()} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-blue-50 shadow-sm p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-6">Atividades Recentes</h2>
        <div className="space-y-4">
          {assignments.slice(0, 5).map(task => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">{task.checklistTitle}</p>
                  <p className="text-xs text-blue-400">Atribuído para {task.assignedToName}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${task.status === 'approved' ? 'bg-green-100 text-green-700' :
                  task.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600'
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-blue-50 shadow-sm shadow-blue-100/50">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <span className="text-2xl font-bold text-blue-900">{value}</span>
      </div>
      <h3 className="font-semibold text-blue-900">{label}</h3>
    </div>
  );
};

const Users = () => {
  const { role: currentUserRole } = useAuth();
  const { users, addUser, updateUser, removeUser } = useData();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({ name: '', email: '', role: UserRole.TECHNICIAN, password: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleOpen = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, role: user.role, password: user.password || '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: UserRole.TECHNICIAN, password: 'Password123!' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
      } else {
        await addUser(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Erro ao processar usuário: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir este usuário?')) {
      try {
        await removeUser(id);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Gestão de Usuários</h1>
          <p className="text-blue-500">Adicione ou remova permissões de acesso.</p>
        </div>
        {currentUserRole === UserRole.ADMIN && (
          <button
            onClick={() => handleOpen()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            <Plus size={20} />
            <span>Novo Usuário</span>
          </button>
        )}
      </header>

      <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-blue-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
            <input
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-10 pr-4 py-2 bg-blue-50/50 rounded-xl border border-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-blue-50/50 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-blue-50/30 transition">
                  <td className="px-6 py-4 font-semibold text-blue-900">{user.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' :
                        user.role === UserRole.COORDINATOR ? 'bg-indigo-100 text-indigo-700' :
                          user.role === UserRole.SUPERVISOR ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-blue-500 text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      {currentUserRole === UserRole.ADMIN && (
                        <>
                          <button onClick={() => handleOpen(user)} className="text-blue-600 text-xs font-bold hover:underline">Editar</button>
                          {user.role !== UserRole.ADMIN && (
                            <button onClick={() => handleDelete(user.id)} className="text-red-400 text-xs font-bold hover:underline">Excluir</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Nome Completo</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">E-mail</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Senha</label>
            <input required type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Nível de Acesso (Perfil)</label>
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-full p-3 rounded-xl border border-blue-100 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value={UserRole.TECHNICIAN}>Técnico (Campo/Oficina)</option>
              <option value={UserRole.SUPERVISOR}>Supervisor</option>
              <option value={UserRole.COORDINATOR}>Coordenador</option>
              <option value={UserRole.ADMIN}>Administrador</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 mt-4 disabled:opacity-50">
            {isSubmitting ? 'Processando...' : editingUser ? 'Salvar Alterações' : 'Criar Acesso'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

const Checklists = () => {
  const { checklists, addChecklist, updateChecklist, removeChecklist } = useData();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingList, setEditingList] = React.useState<any>(null);

  const [formData, setFormData] = React.useState({ title: '', description: '', category: '', items: [{ id: '1', title: '', required: true }] });

  const handleOpen = (list?: any) => {
    if (list) {
      setEditingList(list);
      setFormData(list);
    } else {
      setEditingList(null);
      setFormData({ title: '', description: '', category: '', items: [{ id: '1', title: '', required: true }] });
    }
    setIsModalOpen(true);
  };

  const handleCopy = (list: any) => {
    setEditingList(null);
    setFormData({
      ...list,
      title: `${list.title} (Cópia)`,
      id: undefined
    });
    setIsModalOpen(true);
  };

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { id: Math.random().toString(), title: '', required: true }] });

  const removeItem = (id: string) => setFormData({ ...formData, items: formData.items.filter(i => i.id !== id) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingList) updateChecklist(editingList.id, formData);
    else addChecklist(formData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Modelos de Checklist</h1>
          <p className="text-blue-500">Padronização por ambiente ou setor.</p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          <span>Criar Modelo</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {checklists.map(list => (
          <div key={list.id} className="bg-white p-6 rounded-3xl border border-blue-50 shadow-sm hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                {list.category}
              </span>
              <div className="flex gap-1">
                <button onClick={() => handleCopy(list)} title="Copiar" className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"><Copy size={16} /></button>
                <button onClick={() => handleOpen(list)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold">Editar</button>
                <button onClick={() => removeChecklist(list.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg text-xs font-bold">Excluir</button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">{list.title}</h3>
            <p className="text-sm text-blue-400 mb-6">{list.description}</p>
            <div className="space-y-3">
              {list.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 text-sm text-blue-700">
                  <div className="w-5 h-5 rounded border border-blue-100 flex items-center justify-center text-blue-400">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingList ? 'Editar Modelo' : 'Novo Modelo de Checklist'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Título do Checklist</label>
            <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-3 rounded-xl border border-blue-100 outline-none" placeholder="Ex: Manutenção Preventiva Zebra" />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Categoria</label>
            <input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-3 rounded-xl border border-blue-100 outline-none" placeholder="Ex: Oficina" />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-blue-900">Itens / Tarefas</label>
            {formData.items.map((item, idx) => (
              <div key={item.id} className="flex gap-2">
                <input
                  required
                  value={item.title}
                  onChange={e => {
                    const newItems = [...formData.items];
                    newItems[idx].title = e.target.value;
                    setFormData({ ...formData, items: newItems });
                  }}
                  className="flex-1 p-2 bg-blue-50 rounded-lg border border-blue-50 text-sm outline-none"
                  placeholder={`Tarefa ${idx + 1}`}
                />
                <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><X size={18} /></button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-blue-600 text-xs font-bold flex items-center gap-1 mt-2">
              <Plus size={14} /> Adicionar Item
            </button>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 mt-4">
            {editingList ? 'Salvar Modelo' : 'Criar Checklist'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

const Assignments = () => {
  const { role, user: currentUser } = useAuth();
  const { assignments, checklists, users, addAssignment, removeAssignment } = useData();
  
  const displayAssignments = role === UserRole.TECHNICIAN 
    ? assignments.filter(a => a.assignedTo === currentUser?.id)
    : assignments;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({ checklistId: '', assignedToId: '', dueDate: new Date().toISOString().split('T')[0], isDaily: false });

  const availableUsers = users;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const checklist = checklists.find(c => c.id === formData.checklistId);
    const user = users.find(u => u.id === formData.assignedToId);

    if (checklist && user) {
      await addAssignment({
        checklistId: checklist.id,
        checklistTitle: checklist.title,
        assignedTo: user.id,
        assignedToName: user.name,
        dueDate: formData.dueDate,
        isDaily: formData.isDaily,
        status: AssignmentStatus.PENDING,
        itemsStatus: {}
      });
    }
    setIsModalOpen(false);
    setFormData({ checklistId: '', assignedToId: '', dueDate: new Date().toISOString().split('T')[0], isDaily: false });
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Gestão de Tarefas</h1>
          <p className="text-blue-500">Controle de atendimentos e preventivas.</p>
        </div>
        {role !== UserRole.TECHNICIAN && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            <Plus size={20} />
            <span>Nova Tarefa</span>
          </button>
        )}
      </header>

      <div className="space-y-4">
        {displayAssignments.map(task => (
          <div key={task.id} className="bg-white p-6 rounded-3xl border border-blue-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-200 transition group animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${task.status === AssignmentStatus.PENDING ? 'bg-yellow-100 text-yellow-600' :
                  task.status === 'in_service' ? 'bg-blue-100 text-blue-600' :
                    task.status === 'waiting_part' ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'
                }`}>
                <ClipboardList size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-blue-900">{task.checklistTitle}</h3>
                  {task.isDaily && (
                    <span className="flex items-center gap-1 text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">
                      DIÁRIA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-blue-400 flex items-center gap-1">
                    <UsersIcon size={12} /> {task.assignedToName}
                  </span>
                  <span className="text-xs text-blue-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-between md:justify-end">
              <div className="text-right">
                <p className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${task.status === AssignmentStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                    task.status === 'in_service' ? 'bg-blue-100 text-blue-700' :
                      task.status === 'waiting_part' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                  }`}>
                  {task.status === AssignmentStatus.PENDING ? 'Pendente' :
                    task.status === 'in_service' ? 'Em Execução' :
                      task.status === 'waiting_part' ? 'Aguardando Peça' : 'Concluída'}
                </p>
                <p className="text-xs text-blue-300 mt-1">Status Tarefa</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/assignments/${task.id}`}
                  className="bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-100 transition whitespace-nowrap"
                >
                  Abrir
                </Link>
                {role !== UserRole.TECHNICIAN && (
                  <button
                    onClick={() => removeAssignment(task.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Tarefa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Selecionar Checklist</label>
            <select required value={formData.checklistId} onChange={e => setFormData({ ...formData, checklistId: e.target.value })} className="w-full p-3 rounded-xl border border-blue-100 outline-none bg-white">
              <option value="">Selecione um modelo...</option>
              {checklists.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Atribuir para Usuário</label>
            <select required value={formData.assignedToId} onChange={e => setFormData({ ...formData, assignedToId: e.target.value })} className="w-full p-3 rounded-xl border border-blue-100 outline-none bg-white">
              <option value="">Selecione um usuário...</option>
              {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Data de Execução</label>
            <input required type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full p-3 rounded-xl border border-blue-100 outline-none" />
          </div>
          <div className="pt-2">
            <label className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-50 transition">
              <input
                type="checkbox"
                checked={formData.isDaily}
                onChange={e => setFormData({ ...formData, isDaily: e.target.checked })}
                className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-bold text-blue-900">Execução Diária</p>
                <p className="text-[10px] text-blue-500 uppercase font-bold">Tarefa será resetada automaticamente todos os dias às 00:00h</p>
              </div>
            </label>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 mt-4">
            Gerar Tarefa
          </button>
        </form>
      </Modal>
    </div>
  );
};

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'E-mail ou senha incorretos. Verifique suas credenciais.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-blue-50">Carregando...</div>;

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl shadow-blue-100 border border-blue-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <GTaskLogo className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-blue-900">GTask</h1>
          <p className="text-blue-500 font-medium">Gestão de Checklists Técnicos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-blue-50 text-center">
          <p className="text-xs text-blue-400">Entre com seu e-mail e senha corporativa.</p>
        </div>
      </div>
    </div>
  );
};

const Execution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { assignments, checklists, updateAssignment } = useData();
  const [completedItems, setCompletedItems] = React.useState<string[]>([]);

  const assignment = assignments.find(a => a.id === id);
  const checklist = checklists.find(c => c.id === assignment?.checklistId);

  React.useEffect(() => {
    if (assignment) {
      if (assignment.status === AssignmentStatus.PENDING) {
        updateAssignment(assignment.id, { status: 'in_service' });
      }
      const completed = Object.keys(assignment.itemsStatus || {}).filter(k => assignment.itemsStatus[k]?.completed);
      setCompletedItems(completed);
    }
  }, [id, assignment?.id, !!assignment]);

  if (!assignment || !checklist) return <div>Tarefa não encontrada.</div>;

  // Security check: Technicians can only access their own assignments
  if (role === UserRole.TECHNICIAN && assignment.assignedTo !== user?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-blue-900">Acesso Negado</h2>
        <p className="text-blue-500 mt-2">Você não tem permissão para visualizar esta tarefa.</p>
        <button onClick={() => navigate('/assignments')} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Voltar</button>
      </div>
    );
  }

  const toggleItem = (itemId: string) => {
    const newItems = completedItems.includes(itemId)
      ? completedItems.filter(i => i !== itemId)
      : [...completedItems, itemId];

    setCompletedItems(newItems);

    const itemsStatus = { ...(assignment.itemsStatus || {}) };
    itemsStatus[itemId] = { completed: !completedItems.includes(itemId), timestamp: Date.now() };
    updateAssignment(assignment.id, { itemsStatus });
  };



  const handleFinish = () => {
    updateAssignment(assignment.id, { status: AssignmentStatus.COMPLETED, completedAt: Date.now() });
    navigate('/assignments');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex items-center gap-4">
        <Link to="/assignments" className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition">
          <X size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-blue-900">{assignment.checklistTitle}</h1>
          <div className="flex gap-2 mt-1">
            <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded ${assignment.status === 'in_service' ? 'bg-blue-100 text-blue-700' :
                assignment.status === 'waiting_part' ? 'bg-orange-100 text-orange-700' :
                assignment.status === AssignmentStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
              {assignment.status === 'in_service' ? 'Em Execução' :
               assignment.status === 'waiting_part' ? 'Aguardando Peça' :
               assignment.status === AssignmentStatus.COMPLETED ? 'Concluída' : 'Pendente'}
            </span>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden p-6">
        <div className="space-y-6">
          {checklist.items.map((item: any, idx: number) => (
            <div key={item.id} className={`p-4 rounded-2xl border transition-all ${completedItems.includes(item.id) ? 'bg-green-50 border-green-100' : 'bg-blue-50/30 border-blue-50'}`}>
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`mt-1 flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer border-2 ${
                    completedItems.includes(item.id)
                      ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200/50 dark:shadow-none scale-105'
                      : 'bg-white border-blue-200 hover:border-blue-400'
                  }`}
                >
                  <motion.div
                    initial={false}
                    animate={{ scale: completedItems.includes(item.id) ? 1 : 0, opacity: completedItems.includes(item.id) ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Check size={16} strokeWidth={4} />
                  </motion.div>
                </button>
                <div className="flex-1">
                  <p className={`font-bold transition-colors ${completedItems.includes(item.id) ? 'text-green-600 line-through' : 'text-blue-900'}`}>{item.title}</p>
                  <p className="text-[10px] text-blue-400 mt-1 uppercase font-bold">Verificação {idx + 1} de {checklist.items.length}</p>
                </div>
              </div>


            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-blue-50 flex flex-col gap-4">


          <button
            onClick={handleFinish}
            disabled={completedItems.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-50"
          >
            Finalizar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
};

const Reports = () => {
  const { assignments, users } = useData();
  const [filter, setFilter] = React.useState<'all' | 'completed' | 'incomplete'>('all');

  // Calculate technician performance
  const techPerformance = users
    .filter(u => u.role === UserRole.TECHNICIAN)
    .map(tech => {
      const techAssignments = assignments.filter(a => a.assignedToName === tech.name);
      const completed = techAssignments.filter(a => a.status === AssignmentStatus.COMPLETED || a.status === 'approved').length;
      const rate = techAssignments.length > 0 ? Math.round((completed / techAssignments.length) * 100) : 0;

      return {
        name: tech.name,
        rate,
        color: rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-blue-500' : 'bg-yellow-500'
      };
    })
    .sort((a, b) => b.rate - a.rate);

  const filteredTechPerformance = techPerformance.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'completed') return item.rate === 100;
    if (filter === 'incomplete') return item.rate < 100;
    return true;
  });

  // Calculate monthly volume (simulated based on current assignments distribution)
  // Since we might not have a full history, we'll use current assignments to populate the chart
  const currentMonth = new Date().getMonth();
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Fill last 6 months with some data
  const monthlyData = assignments.reduce((acc: any, curr) => {
    const month = new Date(curr.scheduledAt || curr.dueDate).getMonth();
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const monthIdx = (currentMonth - 5 + i + 12) % 12;
    const count = monthlyData[monthIdx] || 0;
    // Scale count for visualization (max 100%)
    const maxCount = Math.max(...Object.values(monthlyData) as number[]) || 10;
    return {
      name: months[monthIdx],
      count,
      height: Math.max(10, (count / maxCount) * 100)
    };
  });

  // Recent auditoria (completed assignments)
  const history = assignments
    .filter(a => a.status === 'completed' || a.status === 'approved' || a.status === 'rejected')
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-blue-900">Relatórios Operacionais</h1>
        <p className="text-blue-500">Análise de produtividade técnica GTask.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-blue-50 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="text-green-500" size={20} />
              Checklists Concluídos por Técnico
            </h3>

            <div className="flex bg-blue-50 p-1 rounded-xl">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
              >
                Concluíram
              </button>
              <button
                onClick={() => setFilter('incomplete')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === 'incomplete' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-400 hover:text-blue-600'}`}
              >
                Pendentes
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {filteredTechPerformance.map(item => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-blue-900">{item.name}</span>
                  <span className="text-blue-500 font-bold">{item.rate}%</span>
                </div>
                <div className="h-3 bg-blue-50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.rate}%` }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
            {filteredTechPerformance.length === 0 && (
              <p className="text-sm text-blue-400 text-center py-4">Nenhum técnico encontrado com este filtro.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-blue-50 shadow-sm flex flex-col">
          <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            Volume de Atendimentos (Últimos Meses)
          </h3>
          <div className="flex-1 flex items-end justify-between gap-2 h-48 pt-4">
            {chartData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${data.height}%` }}
                  className="w-full bg-blue-100 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer group relative"
                >
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.count} tarefas
                  </span>
                </motion.div>
                <span className="text-[10px] text-blue-400 font-bold">{data.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-blue-50">
          <h3 className="font-bold text-blue-900">Histórico de Atividades</h3>
        </div>
        <div className="divide-y divide-blue-50">
          {history.map(task => (
            <div key={task.id} className="p-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="text-blue-400 font-mono text-xs">#{task.id?.slice(0, 8).toUpperCase()}</div>
                <div>
                  <div className="font-medium text-blue-900">{task.checklistTitle}</div>
                  <div className="text-[10px] text-blue-400">Por: {task.assignedToName}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-blue-400">{task.completedAt ? new Date(task.completedAt).toLocaleDateString() : new Date(task.dueDate).toLocaleDateString()}</span>
                <span className={`font-bold uppercase text-xs ${task.status === 'approved' || task.status === AssignmentStatus.COMPLETED ? 'text-green-600' : 'text-red-500'
                  }`}>
                  {task.status === AssignmentStatus.COMPLETED ? 'Concluído' : task.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                </span>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-sm text-blue-400 text-center py-8">Nenhum histórico de auditoria disponível ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <div className="flex flex-col lg:flex-row min-h-screen bg-blue-50/30 transition-colors duration-300">
                    <Navigation />
                    <main className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full transition-colors duration-300">
                      <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="/checklists" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR]}><Checklists /></ProtectedRoute>} />
                        <Route path="/assignments" element={<Assignments />} />
                        <Route path="/assignments/:id" element={<Execution />} />
                        <Route path="/users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.COORDINATOR]}><Users /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SUPERVISOR]}><Reports /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
