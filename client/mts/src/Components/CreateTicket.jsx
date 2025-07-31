import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Ticket, Users, Settings, LogOut, Plus, Filter, Eye, Check, Clock, AlertCircle } from 'lucide-react';

// Dummy hardcoded users
const DUMMY_USERS = [
  { id: 1, username: 'citizen1', password: 'password', role: 'CITIZEN', name: 'John Doe', department: null },
  { id: 2, username: 'staff1', password: 'password', role: 'STAFF', name: 'Jane Smith', department: 'SANITATION' },
  { id: 3, username: 'staff2', password: 'password', role: 'STAFF', name: 'Mike Johnson', department: 'WATER_SUPPLY' },
  { id: 4, username: 'collector1', password: 'password', role: 'COLLECTOR', name: 'Sarah Wilson', department: null },
  { id: 5, username: 'admin1', password: 'password', role: 'ADMIN', name: 'Admin User', department: null }
];

// Dummy departments
const DEPARTMENTS = [
  { id: 'SANITATION', name: 'Sanitation Department' },
  { id: 'WATER_SUPPLY', name: 'Water Supply Department' },
  { id: 'STREETLIGHTS', name: 'Street Lights Department' },
  { id: 'ROADS', name: 'Roads Department' }
];

// Auth Context
const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      localStorage.removeItem('user');
      return { ...state, user: null, isAuthenticated: false };
    case 'INIT':
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        return { ...state, user: JSON.parse(savedUser), isAuthenticated: true };
      }
      return state;
    default:
      return state;
  }
};

const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false
  });

  useEffect(() => {
    dispatch({ type: 'INIT' });
  }, []);

  const login = (username, password) => {
    const user = DUMMY_USERS.find(u => u.username === username && u.password === password);
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
      return true;
    }
    return false;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Ticket Context
const TicketContext = createContext();

const ticketReducer = (state, action) => {
  switch (action.type) {
    case 'CREATE_TICKET':
      const newTicket = {
        id: Date.now(),
        ticketNumber: `TKT${Date.now()}`,
        ...action.payload,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updatedTickets = [...state.tickets, newTicket];
      localStorage.setItem('tickets', JSON.stringify(updatedTickets));
      return { ...state, tickets: updatedTickets };
    
    case 'UPDATE_TICKET':
      const updated = state.tickets.map(ticket => 
        ticket.id === action.payload.id 
          ? { ...ticket, ...action.payload.updates, updatedAt: new Date().toISOString() }
          : ticket
      );
      localStorage.setItem('tickets', JSON.stringify(updated));
      return { ...state, tickets: updated };
    
    case 'LOAD_TICKETS':
      const savedTickets = localStorage.getItem('tickets');
      return { 
        ...state, 
        tickets: savedTickets ? JSON.parse(savedTickets) : [] 
      };
    
    default:
      return state;
  }
};

const TicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ticketReducer, { tickets: [] });

  useEffect(() => {
    dispatch({ type: 'LOAD_TICKETS' });
  }, []);

  const createTicket = (ticketData) => {
    dispatch({ type: 'CREATE_TICKET', payload: ticketData });
  };

  const updateTicket = (id, updates) => {
    dispatch({ type: 'UPDATE_TICKET', payload: { id, updates } });
  };

  return (
    <TicketContext.Provider value={{ ...state, createTicket, updateTicket }}>
      {children}
    </TicketContext.Provider>
  );
};

const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within TicketProvider');
  }
  return context;
};

// Login Component
const Login = () => {
  const [credentials, setCredentials] = React.useState({ username: '', password: '' });
  const [error, setError] = React.useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(credentials.username, credentials.password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Municipal Ticket System</h2>
        
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
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </form>
        
        <div className="mt-6 text-sm text-gray-600">
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

// Sidebar Component
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' }
    ];
    
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
          { icon: Ticket, label: 'All Tickets', path: '/all-tickets' },
          { icon: Users, label: 'Manage Users', path: '/users' },
          { icon: Settings, label: 'System Settings', path: '/settings' }
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-gray-800 text-white transform transition-transform z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        
        {/* Header */}
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
          <p className="text-xs text-gray-500">{user.role}</p>
        </div>
        
        {/* Menu */}
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
        
        {/* Logout */}
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

// Header Component
const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 lg:ml-64">
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

// Layout Component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className="lg:ml-64 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();
  const { tickets } = useTickets();

  const getStats = () => {
    let userTickets = tickets;
    
    if (user.role === 'CITIZEN') {
      userTickets = tickets.filter(t => t.createdBy === user.id);
    } else if (user.role === 'STAFF') {
      userTickets = tickets.filter(t => t.department === user.department);
    }

    return {
      total: userTickets.length,
      open: userTickets.filter(t => t.status === 'OPEN').length,
      inProgress: userTickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: userTickets.filter(t => t.status === 'RESOLVED').length
    };
  };

  const stats = getStats();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ticket className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-gray-600">Welcome to the Municipal Ticket Management System!</p>
        <p className="text-sm text-gray-500 mt-2">
          Role: {user.role} {user.department && `| Department: ${user.department}`}
        </p>
      </div>
    </div>
  );
};

// Create Ticket Component
const CreateTicket = () => {
  const { user } = useAuth();
  const { createTicket } = useTickets();
  const navigate = useNavigate();
  
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    location: '',
    department: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createTicket({
      ...formData,
      createdBy: user.id,
      createdByName: user.name
    });
    alert('Ticket created successfully!');
    navigate('/my-tickets');
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
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
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
            >
              Create Ticket
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Ticket Card Component
const TicketCard = ({ ticket, showActions = false, userRole }) => {
  const { updateTicket } = useTickets();
  
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
    updateTicket(ticket.id, { status: newStatus });
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
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
            >
              Start Progress
            </button>
          )}
          {ticket.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusUpdate('RESOLVED')}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Mark Resolved
            </button>
          )}
          {ticket.status === 'RESOLVED' && (
            <button
              onClick={() => handleStatusUpdate('CLOSED')}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Close Ticket
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// My Tickets Component (for Citizens)
const MyTickets = () => {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const [filter, setFilter] = React.useState('ALL');
  
  const userTickets = tickets.filter(t => t.createdBy === user.id);
  
  const filteredTickets = filter === 'ALL' 
    ? userTickets 
    : userTickets.filter(t => t.status === filter);

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
      
      {filteredTickets.length === 0 ? (
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

// Department Tickets Component (for Staff)
const DepartmentTickets = () => {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const [filter, setFilter] = React.useState('ALL');
  
  const departmentTickets = tickets.filter(t => t.department === user.department);
  
  const filteredTickets = filter === 'ALL' 
    ? departmentTickets 
    : departmentTickets.filter(t => t.status === filter);

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
      
      {filteredTickets.length === 0 ? (
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

// All Tickets Component (for Collector/Admin)
const AllTickets = () => {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const [filter, setFilter] = React.useState('ALL');
  const [departmentFilter, setDepartmentFilter] = React.useState('ALL');
  
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
            {DEPARTMENTS.map(dept => (
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
      
      {filteredTickets.length === 0 ? (
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

// Departments Management Component (for Collector)
const DepartmentsManagement = () => {
  const { tickets } = useTickets();
  
  const getDepartmentStats = (deptId) => {
    const deptTickets = tickets.filter(t => t.department === deptId);
    return {
      total: deptTickets.length,
      open: deptTickets.filter(t => t.status === 'OPEN').length,
      inProgress: deptTickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: deptTickets.filter(t => t.status === 'RESOLVED').length
    };
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Department Management</h2>
      
      <div className="grid gap-6">
        {DEPARTMENTS.map(dept => {
          const stats = getDepartmentStats(dept.id);
          const staff = DUMMY_USERS.filter(u => u.department === dept.id);
          
          return (
            <div key={dept.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{dept.name}</h3>
                  <p className="text-sm text-gray-600">Department ID: {dept.id}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total Tickets</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-red-600">{stats.open}</p>
                  <p className="text-xs text-gray-500">Open</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-yellow-600">{stats.inProgress}</p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">{stats.resolved}</p>
                  <p className="text-xs text-gray-500">Resolved</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Staff Members:</h4>
                {staff.length > 0 ? (
                  <div className="space-y-1">
                    {staff.map(member => (
                      <p key={member.id} className="text-sm text-gray-600">
                        {member.name} ({member.username})
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No staff assigned</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Users Management Component (for Admin)
const UsersManagement = () => {
  const [users, setUsers] = React.useState(DUMMY_USERS);
  const [showAddUser, setShowAddUser] = React.useState(false);
  const [newUser, setNewUser] = React.useState({
    username: '',
    password: '',
    name: '',
    role: 'CITIZEN',
    department: ''
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    const user = {
      id: Date.now(),
      ...newUser,
      department: newUser.role === 'STAFF' ? newUser.department : null
    };
    setUsers([...users, user]);
    setNewUser({ username: '', password: '', name: '', role: 'CITIZEN', department: '' });
    setShowAddUser(false);
    alert('User added successfully!');
  };

  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, role: newRole, department: newRole === 'STAFF' ? user.department : null }
        : user
    ));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add User
        </button>
      </div>
      
      {showAddUser && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New User</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="CITIZEN">Citizen</option>
                <option value="STAFF">Staff</option>
                <option value="COLLECTOR">Collector</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            
            {newUser.role === 'STAFF' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add User
              </button>
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CITIZEN">Citizen</option>
                    <option value="STAFF">Staff</option>
                    <option value="COLLECTOR">Collector</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.department || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Settings Component (for Admin)
const Settings = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">System Settings</h2>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Application Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Name</label>
            <input
              type="text"
              defaultValue="Municipal Ticket Management System"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Ticket Priority</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">System Information</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Version: 1.0.0</p>
              <p className="text-sm text-gray-600">Last Updated: {new Date().toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Total Users: {DUMMY_USERS.length}</p>
              <p className="text-sm text-gray-600">Departments: {DEPARTMENTS.length}</p>
            </div>
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <TicketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-ticket" 
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <CreateTicket />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <MyTickets />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/department-tickets" 
              element={
                <ProtectedRoute allowedRoles={['STAFF']}>
                  <DepartmentTickets />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/all-tickets" 
              element={
                <ProtectedRoute allowedRoles={['COLLECTOR', 'ADMIN']}>
                  <AllTickets />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/departments" 
              element={
                <ProtectedRoute allowedRoles={['COLLECTOR']}>
                  <DepartmentsManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </TicketProvider>
    </AuthProvider>
  );
};

export default App;