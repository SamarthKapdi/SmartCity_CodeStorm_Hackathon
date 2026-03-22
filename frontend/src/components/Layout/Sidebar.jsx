import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { announcementAPI } from '../../services/api';
import {
  LayoutDashboard, Car, Trash2, Droplets, Lightbulb,
  AlertTriangle, Bell, ScrollText, LogOut, ChevronLeft,
  ChevronRight, Shield, Zap, MessageSquare, Sun, Moon, Bot, Megaphone
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const { user, logout, isAdmin, isOperator, isUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Fetch announcement count for citizens
  useEffect(() => {
    if (isUser && user?.zone) {
      const fetchAnnouncementCount = async () => {
        try {
          const res = await announcementAPI.getAll({ status: 'active' });
          const filtered = res.data.data.filter(a => a.zones.includes(user.zone) || a.zones.includes('all'));
          setAnnouncementCount(filtered.length);
        } catch (err) {
          console.error('Fetch announcements error:', err);
        }
      };
      fetchAnnouncementCount();
      const interval = setInterval(fetchAnnouncementCount, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isUser, user?.zone]);

  // Build nav items based on role
  const getNavItems = () => {
    const items = [];

    // Complaints is available to ALL roles
    items.push({ path: '/complaints', label: 'Complaints', icon: MessageSquare });

    if (isAdmin || isOperator) {
      // Admin and operators see full city modules
      items.unshift(
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/traffic', label: 'Traffic', icon: Car },
        { path: '/waste', label: 'Waste', icon: Trash2 },
        { path: '/water', label: 'Water', icon: Droplets },
        { path: '/lighting', label: 'Lighting', icon: Lightbulb },
        { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
        { path: '/alerts', label: 'Alerts', icon: Bell },
      );
    }

    if (isUser) {
      // Citizens only see complaints (already added above)
      items.unshift({ path: '/', label: 'Dashboard', icon: LayoutDashboard });
      items.push(
        { path: '/assistant', label: 'City Assistant', icon: Bot },
        { path: '/announcements', label: 'City Alerts', icon: Bell, badge: announcementCount }
      );
    }

    return items;
  };

  const adminItems = isAdmin ? [
    { path: '/admin/announcements', label: 'City Announcements', icon: Megaphone },
    { path: '/logs', label: 'Activity Logs', icon: ScrollText },
  ] : [];

  const navItems = getNavItems();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Zap size={20} />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <span className="logo-title">SmartCity</span>
              <span className="logo-subtitle">Command Center</span>
            </div>
          )}
        </div>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <span className="nav-section-label">
            {isUser ? 'Citizen Portal' : 'Modules'}
          </span>}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <div className="nav-item-content">
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
                {item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </div>
            </NavLink>
          ))}
        </div>

        {adminItems.length > 0 && (
          <div className="nav-section">
            {!collapsed && <span className="nav-section-label">Admin</span>}
            {adminItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        {/* Theme Toggle */}
        <button className="theme-toggle-btn" onClick={toggleTheme} title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <div className="user-card">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">
                <Shield size={11} />
                {user?.role}
              </span>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
