import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router'; // Added Link for navigation
import { Menu, X, Home, Ticket, Users, Settings, LogOut, Plus, Filter, Eye, Check, Clock, AlertCircle, Trash2, Edit } from 'lucide-react';
import axios from 'axios';

// Base URL for your Spring Boot API
const API_BASE_URL = 'http://localhost:8080/api';

// Axios instance for API calls
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// --- Message Modal Component ---
// This component displays success or error messages to the user.
const MessageModal = ({ message, type, onClose }) => {
  const bgColor = type === 'error' ? 'bg-red-100' : 'bg-green-100';
  const textColor = type === 'error' ? 'text-red-800' : 'text-green-800';
  const borderColor = type === 'error' ? 'border-red-400' : 'border-green-400';

  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`relative ${bgColor} ${textColor} border ${borderColor} rounded-lg p-6 shadow-xl max-w-sm w-full text-center`}>
        <p className="font-semibold text-lg mb-4">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

// --- Auth Context ---
// Manages user authentication state (login, logout, user data).
const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return { ...state, user: action.payload, isAuthenticated: true, loading: false };
    case 'LOGOUT':
      localStorage.removeItem('user');
      return { ...state, user: null, isAuthenticated: false };
    case 'INIT':
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        return { ...state, user: JSON.parse(savedUser), isAuthenticated: true, loading: false };
      }
      return { ...state, loading: false };
    case 'SET_LOADING':
        return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    loading: true,
  });
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    dispatch({ type: 'INIT' });
  }, []);

  const login = async (username, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.post('/login', { username, password });
      if (response.data) {
        dispatch({ type: 'LOGIN', payload: response.data });
        return true;
      }
    } catch (error) {
      console.error("Login failed", error);
      setMessage("Login failed. Please check your credentials.");
      setMessageType('error');
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
    return false;
  };

  // New registration function
  const register = async (username, password, name) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.post('/register', { username, password, name });
      if (response.status === 201) { // 201 Created
        setMessage("Registration successful! Please log in.");
        setMessageType('success');
        return true;
      }
    } catch (error) {
      console.error("Registration failed", error);
      if (error.response && error.response.status === 409) {
        setMessage("Registration failed: Username already exists.");
      } else {
        setMessage("Registration failed. Please try again.");
      }
      setMessageType('error');
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
    return false;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    setMessage("You have been logged out.");
    setMessageType('success');
  };

  const clearMessage = () => setMessage(null);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setMessage, setMessageType }}>
      {!state.loading && children}
      <MessageModal message={message} type={messageType} onClose={clearMessage} />
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- Data Context ---
// Manages global data like departments.
const DataContext = createContext();

const DataProvider = ({ children }) => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { setMessage, setMessageType } = useAuth(); // Assuming AuthContext provides these

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/departments');
            setDepartments(response.data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
            setMessage("Failed to load departments.");
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const createDepartment = async (departmentData) => {
        try {
            const response = await api.post('/departments', departmentData);
            setDepartments(prev => [...prev, response.data]);
            setMessage("Department created successfully!");
            setMessageType('success');
            return true;
        } catch (error) {
            console.error("Failed to create department", error);
            setMessage("Failed to create department.");
            setMessageType('error');
            return false;
        }
    };

    const updateDepartment = async (id, newName) => {
        try {
            const response = await api.put(`/departments/${id}`, { name: newName });
            setDepartments(prev => prev.map(dept => dept.id === id ? response.data : dept));
            setMessage("Department updated successfully!");
            setMessageType('success');
            return true;
        } catch (error) {
            console.error("Failed to update department", error);
            setMessage("Failed to update department.");
            setMessageType('error');
            return false;
        }
    };

    const deleteDepartment = async (id) => {
        try {
            await api.delete(`/departments/${id}`);
            setDepartments(prev => prev.filter(dept => dept.id !== id));
            setMessage("Department deleted successfully!");
            setMessageType('success');
            return true;
        } catch (error) {
            console.error("Failed to delete department", error);
            setMessage("Failed to delete department.");
            setMessageType('error');
            return false;
        }
    };

    return (
        <DataContext.Provider value={{ departments, loading, createDepartment, updateDepartment, deleteDepartment, fetchDepartments }}>
            {!loading && children}
        </DataContext.Provider>
    );
};

const useData = () => useContext(DataContext);


// --- Ticket Context ---
// Manages ticket-related state and actions.
const TicketContext = createContext();

const ticketReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TICKETS':
        return { ...state, tickets: action.payload, loading: false };
    case 'ADD_TICKET':
        return { ...state, tickets: [...state.tickets, action.payload] };
    case 'UPDATE_TICKET_IN_STATE':
        return {
            ...state,
            tickets: state.tickets.map(t => t.id === action.payload.id ? action.payload : t)
        };
    case 'SET_LOADING':
        return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const TicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ticketReducer, { tickets: [], loading: true });
  const { user, setMessage, setMessageType } = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
        if (!user) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            let response;
            if (user.role === 'CITIZEN') {
                response = await api.get(`/tickets?userId=${user.id}`);
            } else if (user.role === 'STAFF') {
                response = await api.get(`/tickets?department=${user.department}`);
            } else { // COLLECTOR, ADMIN
                response = await api.get('/tickets');
            }
            dispatch({ type: 'SET_TICKETS', payload: response.data });
        } catch (error) {
            console.error("Failed to fetch tickets", error);
            setMessage("Failed to load tickets.");
            setMessageType('error');
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
    fetchTickets();
  }, [user, setMessage, setMessageType]); // Added setMessage, setMessageType to dependencies

  const createTicket = async (ticketData) => {
    try {
      const response = await api.post('/tickets', ticketData);
      dispatch({ type: 'ADD_TICKET', payload: response.data });
      return response.data;
    } catch (error) {
      console.error("Failed to create ticket", error);
      setMessage("Failed to create ticket.");
      setMessageType('error');
      return null;
    }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      const response = await api.put(`/tickets/${id}/status`, JSON.stringify(status));
      dispatch({ type: 'UPDATE_TICKET_IN_STATE', payload: response.data });
      setMessage(`Ticket #${response.data.ticketNumber} status updated to ${status.replace('_', ' ')}.`);
      setMessageType('success');
    } catch (error) {
      console.error("Failed to update ticket", error);
      setMessage("Failed to update ticket status.");
      setMessageType('error');
    }
  };

  return (
    <TicketContext.Provider value={{ ...state, createTicket, updateTicketStatus }}>
      {children}
    </TicketContext.Provider>
  );
};

const useTickets = () => useContext(TicketContext);


// --- Login Component ---
const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(credentials.username, credentials.password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Municipal Ticket System</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-sm text-center text-gray-600">
          <p className="mb-2">Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register here</Link></p>
          <p className="font-semibold mb-2">Demo Users:</p>
          <div className="space-y-1">
            <p>Citizen: citizen1 / password</p>
            <p>Staff: staff1 / password</p>
            <p>Collector: collector1 / password</p>
            <p>Admin: admin1 / password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Register Component ---
const Register = () => {
    const [formData, setFormData] = useState({ username: '', password: '', name: '' });
    const [error, setError] = useState('');
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await register(formData.username, formData.password, formData.name);
        if (success) {
            navigate('/login'); // Redirect to login after successful registration
        } else {
            // Error message is handled by AuthContext's MessageModal
            setError('Registration failed. Please try a different username.'); // Fallback error for immediate feedback
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Register New Account</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                    
                    {error && (
                        <div className="text-red-600 text-sm">{error}</div>
                    )}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                
                <div className="mt-6 text-sm text-center text-gray-600">
                    <p>Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link></p>
                </div>
            </div>
        </div>
    );
};


// --- Sidebar Component ---
const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const getMenuItems = () => {
      const baseItems = [
        { icon: Home, label: 'Dashboard', path: '/dashboard' }
      ];
      
      if (!user) return [];

      switch (user.role) {
        case 'CITIZEN':
          return [
            ...baseItems,
            { icon: Plus, label: 'Create Ticket', path: '/create-ticket' },
            { icon: Ticket, label: 'My Tickets', path: '/my-tickets' }
          ];
        case 'STAFF':
          return [
            ...baseItems,
            { icon: Ticket, label: 'Department Tickets', path: '/department-tickets' }
          ];
        case 'COLLECTOR':
          return [
            ...baseItems,
            { icon: Ticket, label: 'All Tickets', path: '/all-tickets' },
            { icon: Users, label: 'Manage Departments', path: '/departments' }
          ];
        case 'ADMIN':
          return [
            ...baseItems,
            { icon: Users, label: 'Manage Users', path: '/users' },
            { icon: Settings, label: 'System Settings', path: '/settings' }
          ];
        default:
          return baseItems;
      }
    };
  
    const menuItems = getMenuItems();
  
    if (!user) return null;

    return (
      <>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
        
        <div className={`fixed left-0 top-0 h-full w-64 bg-gray-800 text-white transform transition-transform z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 font-sans`}>
          
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ticket System</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1">{user.name}</p>
            <p className="text-xs text-gray-500">{user.role} {user.department && `(${user.department})`}</p>
          </div>
          
          <nav className="p-4 flex-1">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-red-400"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </>
    );
  };
  
  // --- Header Component ---
  const Header = ({ sidebarOpen, setSidebarOpen }) => {
    const { user } = useAuth();
  
    if (!user) return null;

    return (
      <header className="bg-white shadow-sm border-b border-gray-200 lg:ml-64 fixed w-full top-0 z-10 font-sans">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-800">
              Municipal Ticket Management
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}</span>
          </div>
        </div>
      </header>
    );
  };
  
  // --- Layout Component ---
  const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
  
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="lg:ml-64 pt-16"> {/* pt-16 to offset fixed header */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    );
  };

// --- Dashboard Component ---
const Dashboard = () => {
    const { user } = useAuth();
    const { tickets, loading } = useTickets();
  
    const getStats = () => {
      if (loading || !tickets) return { total: 0, open: 0, inProgress: 0, resolved: 0 };
      
      return {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'OPEN').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        resolved: tickets.filter(t => t.status === 'RESOLVED').length
      };
    };
  
    const stats = getStats();
  
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
        {loading ? <p>Loading dashboard...</p> : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Stat cards */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg"><Ticket className="h-6 w-6 text-blue-600" /></div>
                            <div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Tickets</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="h-6 w-6 text-red-600" /></div>
                            <div className="ml-4"><p className="text-sm font-medium text-gray-600">Open</p><p className="text-2xl font-bold text-gray-900">{stats.open}</p></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-6 w-6 text-yellow-600" /></div>
                            <div className="ml-4"><p className="text-sm font-medium text-gray-600">In Progress</p><p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg"><Check className="h-6 w-6 text-green-600" /></div>
                            <div className="ml-4"><p className="text-sm font-medium text-gray-600">Resolved</p><p className="text-2xl font-bold text-gray-900">{stats.resolved}</p></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <p className="text-gray-600">Welcome to the Municipal Ticket Management System!</p>
                    <p className="text-sm text-gray-500 mt-2">Role: {user.role} {user.department && `| Department: ${user.department}`}</p>
                </div>
            </>
        )}
      </div>
    );
  };

// --- Create Ticket Component ---
const CreateTicket = () => {
    const { user, setMessage, setMessageType } = useAuth();
    const { createTicket } = useTickets();
    const { departments } = useData();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      category: '',
      priority: 'MEDIUM',
      location: '',
      department: ''
    });
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      const newTicket = await createTicket({
        ...formData,
        createdBy: user.id,
        createdByName: user.name
      });
      if (newTicket) {
        setMessage('Ticket created successfully!');
        setMessageType('success');
        navigate('/my-tickets');
      } else {
        setMessage('Failed to create ticket.');
        setMessageType('error');
      }
    };
  
    return (
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Ticket</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select Category</option>
                <option value="SANITATION">Sanitation</option>
                <option value="WATER_SUPPLY">Water Supply</option>
                <option value="STREETLIGHTS">Street Lights</option>
                <option value="ROADS">Roads</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors">Create Ticket</button>
              <button type="button" onClick={() => navigate('/dashboard')} className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-400 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

// --- TicketCard Component ---
// Displays individual ticket details and allows status updates.
const TicketCard = ({ ticket, showActions = false, userRole }) => {
    const { updateTicketStatus } = useTickets();
    
    const getStatusColor = (status) => {
        switch (status) {
          case 'OPEN': return 'bg-red-100 text-red-800 border-red-200';
          case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
          case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
      };
    
      const getPriorityColor = (priority) => {
        switch (priority) {
          case 'HIGH': return 'text-red-600';
          case 'MEDIUM': return 'text-yellow-600';
          case 'LOW': return 'text-green-600';
          default: return 'text-gray-600';
        }
      };

    const handleStatusUpdate = (newStatus) => {
      updateTicketStatus(ticket.id, newStatus);
    };
  
    return (
        <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-800">{ticket.title}</h3>
            <p className="text-sm text-gray-500">#{ticket.ticketNumber}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
        
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span>{ticket.category}</span>
          <span>{ticket.department}</span>
          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>
        
        {ticket.location && (
          <p className="text-sm text-gray-600 mb-3">📍 {ticket.location}</p>
        )}
        
        {ticket.createdByName && (
          <p className="text-sm text-gray-500 mb-3">Created by: {ticket.createdByName}</p>
        )}
        
        {showActions && (userRole === 'STAFF' || userRole === 'COLLECTOR' || userRole === 'ADMIN') && (
          <div className="flex gap-2 flex-wrap">
            {ticket.status === 'OPEN' && (
              <button
                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
              >
                Start Progress
              </button>
            )}
            {ticket.status === 'IN_PROGRESS' && (
              <button
                onClick={() => handleStatusUpdate('RESOLVED')}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              >
                Mark Resolved
              </button>
            )}
            {ticket.status === 'RESOLVED' && (
              <button
                onClick={() => handleStatusUpdate('CLOSED')}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Close Ticket
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

// --- My Tickets Component (for Citizens) ---
const MyTickets = () => {
    const { user } = useAuth();
    const { tickets, loading } = useTickets();
    const [filter, setFilter] = useState('ALL');
    
    const filteredTickets = filter === 'ALL' 
      ? tickets 
      : tickets.filter(t => t.status === filter);
  
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Tickets</h2>
          <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Tickets</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
        
        {loading ? <p>Loading tickets...</p> : filteredTickets.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No tickets found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} userRole={user.role} />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // --- Department Tickets Component (for Staff) ---
  const DepartmentTickets = () => {
    const { user } = useAuth();
    const { tickets, loading } = useTickets();
    const [filter, setFilter] = useState('ALL');
    
    const filteredTickets = filter === 'ALL' 
      ? tickets 
      : tickets.filter(t => t.status === filter);
  
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Department Tickets</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Department: {user.department}</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Tickets</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
        
        {loading ? <p>Loading tickets...</p> : filteredTickets.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No tickets found for your department</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} showActions={true} userRole={user.role} />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // --- All Tickets Component (for Collector/Admin) ---
  const AllTickets = () => {
    const { user } = useAuth();
    const { tickets, loading } = useTickets();
    const { departments } = useData();
    const [filter, setFilter] = useState('ALL');
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    
    let filteredTickets = tickets;
    
    if (filter !== 'ALL') {
      filteredTickets = filteredTickets.filter(t => t.status === filter);
    }
    
    if (departmentFilter !== 'ALL') {
      filteredTickets = filteredTickets.filter(t => t.department === departmentFilter);
    }
  
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">All Tickets</h2>
          <div className="flex items-center gap-4">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
        
        {loading ? <p>Loading tickets...</p> : filteredTickets.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No tickets found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} showActions={true} userRole={user.role} />
            ))}
          </div>
        )}
      </div>
    );
  };

// --- Manage Departments Component (for Collector) ---
const ManageDepartments = () => {
    const { departments, loading, createDepartment, updateDepartment, deleteDepartment } = useData();
    const [newDeptName, setNewDeptName] = useState('');
    const [newDeptId, setNewDeptId] = useState('');
    const [editingDept, setEditingDept] = useState(null); // { id, name }
    const [editedDeptName, setEditedDeptName] = useState('');
    const { setMessage, setMessageType } = useAuth(); // For showing messages

    const handleCreate = async (e) => {
        e.preventDefault();
        if (newDeptId && newDeptName) {
            const success = await createDepartment({ id: newDeptId.toUpperCase(), name: newDeptName });
            if (success) {
                setNewDeptId('');
                setNewDeptName('');
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (editingDept && editedDeptName) {
            const success = await updateDepartment(editingDept.id, editedDeptName);
            if (success) {
                setEditingDept(null);
                setEditedDeptName('');
            }
        }
    };

    const handleDelete = async (id) => {
        // Using window.confirm for simplicity, ideally replace with a custom modal
        if (window.confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
            await deleteDepartment(id);
        }
    };

    const startEditing = (dept) => {
        setEditingDept(dept);
        setEditedDeptName(dept.name);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Departments</h2>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Department</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department ID (e.g., SANITATION)</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newDeptId}
                            onChange={(e) => setNewDeptId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name (e.g., Sanitation Department)</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors">Add Department</button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Existing Departments</h3>
                {loading ? <p>Loading departments...</p> : departments.length === 0 ? (
                    <p className="text-gray-500">No departments found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {departments.map((dept) => (
                                    <tr key={dept.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {editingDept && editingDept.id === dept.id ? (
                                                <input
                                                    type="text"
                                                    value={editedDeptName}
                                                    onChange={(e) => setEditedDeptName(e.target.value)}
                                                    className="border border-gray-300 rounded-md px-2 py-1"
                                                />
                                            ) : (
                                                dept.name
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {editingDept && editingDept.id === dept.id ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleUpdate}
                                                        className="text-green-600 hover:text-green-900 transition-colors"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingDept(null)}
                                                        className="text-gray-600 hover:text-gray-900 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEditing(dept)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dept.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Manage Users Component (for Admin) ---
const ManageUsers = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const { setMessage, setMessageType } = useAuth();
    const { departments, loading: loadingDepartments } = useData(); // Get departments for dropdown

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            setMessage("Failed to load users.");
            setMessageType('error');
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        // Using window.confirm for simplicity, ideally replace with a custom modal
        if (window.confirm(`Are you sure you want to change the role of this user to ${newRole}?`)) {
            try {
                const response = await api.put(`/users/${userId}/role`, JSON.stringify(newRole));
                setUsers(prev => prev.map(u => u.id === userId ? response.data : u));
                setMessage("User role updated successfully!");
                setMessageType('success');
            } catch (error) {
                console.error("Failed to update user role", error);
                setMessage("Failed to update user role.");
                setMessageType('error');
            }
        }
    };

    // New handler for department change
    const handleDepartmentChange = async (userId, newDepartmentId) => {
        if (window.confirm(`Are you sure you want to change the department of this user to ${newDepartmentId || 'None'}?`)) {
            try {
                const response = await api.put(`/users/${userId}/department`, JSON.stringify(newDepartmentId));
                setUsers(prev => prev.map(u => u.id === userId ? response.data : u));
                setMessage("User department updated successfully!");
                setMessageType('success');
            } catch (error) {
                console.error("Failed to update user department", error);
                setMessage("Failed to update user department.");
                setMessageType('error');
            }
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Users</h2>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">All Users</h3>
                {(loadingUsers || loadingDepartments) ? <p>Loading users and departments...</p> : users.length === 0 ? (
                    <p className="text-gray-500">No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {u.id !== user.id ? ( // Cannot change own role
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="CITIZEN">CITIZEN</option>
                                                    <option value="STAFF">STAFF</option>
                                                    <option value="COLLECTOR">COLLECTOR</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                            ) : u.role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {u.id !== user.id ? ( // Cannot change own department
                                                <select
                                                    value={u.department || ''} // Handle null department
                                                    onChange={(e) => handleDepartmentChange(u.id, e.target.value || null)} // Pass null if empty
                                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">None</option> {/* Option to clear department */}
                                                    {departments.map(dept => (
                                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                    ))}
                                                </select>
                                            ) : (u.department || 'N/A')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {/* Actions column can be extended if needed */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Placeholder Component for unimplemented routes ---
const Placeholder = ({ title }) => (
  <div className="bg-white p-8 rounded-lg shadow text-center">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
    <p className="text-gray-600">This section is under construction. Check back later!</p>
  </div>
);

// --- Protected Route Component ---
// Ensures users are authenticated and have the correct role to access certain routes.
const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();
  
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center text-lg text-gray-700">Loading application...</div>;
    }
  
    if (!isAuthenticated) {
      // User not authenticated, redirect to login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  
    if (roles && user && !roles.includes(user.role)) {
      // User authenticated but does not have the required role
      // Redirect to dashboard as an unauthorized page
      return <Navigate to="/dashboard" replace />;
    }
  
    return children;
  };

// --- Main App Component ---
export default function App() {
    return (
      <Router>
        <AuthProvider>
          <DataProvider>
            <TicketProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} /> {/* New Registration Route */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/create-ticket" element={<ProtectedRoute roles={['CITIZEN']}><Layout><CreateTicket /></Layout></ProtectedRoute>} />
                <Route path="/my-tickets" element={<ProtectedRoute roles={['CITIZEN']}><Layout><MyTickets /></Layout></ProtectedRoute>} />
                <Route path="/department-tickets" element={<ProtectedRoute roles={['STAFF']}><Layout><DepartmentTickets /></Layout></ProtectedRoute>} />
                <Route path="/all-tickets" element={<ProtectedRoute roles={['COLLECTOR', 'ADMIN']}><Layout><AllTickets /></Layout></ProtectedRoute>} />
                <Route path="/departments" element={<ProtectedRoute roles={['COLLECTOR']}><Layout><ManageDepartments /></Layout></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><Layout><ManageUsers /></Layout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute roles={['ADMIN']}><Layout><Placeholder title="System Settings" /></Layout></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} /> {/* Catch-all for undefined routes */}
              </Routes>
            </TicketProvider>
          </DataProvider>
        </AuthProvider>
      </Router>
    );
  }
