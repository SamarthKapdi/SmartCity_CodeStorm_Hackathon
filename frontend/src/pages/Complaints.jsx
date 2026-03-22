import { useState, useEffect } from 'react';
import { complaintAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare, MapPin, Clock, User, RefreshCw, Plus, X,
  CheckCircle, AlertTriangle, ArrowRight, Timer, Award, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './ModulePage.css';
import './Complaints.css';

const STATUS_COLORS = { 'open': '#3b82f6', 'in-progress': '#f59e0b', 'resolved': '#10b981' };
const PRIORITY_COLORS = { 'low': '#10b981', 'medium': '#f59e0b', 'high': '#ef4444' };

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', category: '' });
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(null);
  const [operators, setOperators] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: 'traffic', location: '', zone: 'central' });
  const [assignForm, setAssignForm] = useState({ assignedTo: '', priority: 'medium', deadline: '' });
  const [statusForm, setStatusForm] = useState({ status: '', remark: '' });
  const { isAdmin, isOperator, isUser } = useAuth();

  const fetchData = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.category) params.category = filter.category;
      const res = await complaintAPI.getAll(params);
      setComplaints(res.data.data);
      if (isAdmin) {
        try {
          const statsRes = await complaintAPI.getStats();
          setStats(statsRes.data.data);
        } catch (e) { console.error('Stats error:', e); }
      }
    } catch (err) {
      console.error('Complaints error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  // Create complaint (citizen only)
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await complaintAPI.create(form);
      setShowModal(false);
      setForm({ title: '', description: '', category: 'traffic', location: '', zone: 'central' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  // Admin: open assign modal
  const openAssign = async (complaint) => {
    setShowAssignModal(complaint);
    setAssignForm({ assignedTo: '', priority: complaint.priority, deadline: '' });
    try {
      const [opsRes, sugRes] = await Promise.all([
        authAPI.getOperators(),
        complaintAPI.suggestOperator({ category: complaint.category, zone: complaint.zone })
      ]);
      setOperators(opsRes.data.data);
      setSuggestions(sugRes.data.data);
    } catch (e) { console.error(e); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await complaintAPI.assign(showAssignModal._id, assignForm);
      setShowAssignModal(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  // Operator: open status modal
  const openStatusUpdate = (complaint) => {
    const nextStatus = complaint.status === 'open' ? 'in-progress' : 'resolved';
    setShowStatusModal(complaint);
    setStatusForm({ status: nextStatus, remark: '' });
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await complaintAPI.updateStatus(showStatusModal._id, statusForm);
      setShowStatusModal(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  // Charts for admin
  const catChartData = stats?.byCategory?.map((c, i) => ({
    name: c._id?.charAt(0).toUpperCase() + c._id?.slice(1), count: c.count
  })) || [];

  const statusChartData = stats?.byStatus?.map(s => ({
    name: s._id, value: s.count, fill: STATUS_COLORS[s._id] || '#64748b'
  })) || [];

  const perfData = stats?.operatorPerformance?.map(op => ({
    name: op.name, resolved: op.resolved, avgTime: op.avgTime
  })) || [];

  return (
    <div className="module-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>📝 {isUser ? 'My Complaints' : isOperator ? 'Assigned Complaints' : 'All Complaints'}</h1>
          <p>
            {isUser ? 'File and track your city complaints' :
             isOperator ? 'Manage complaints assigned to you' :
             `Manage all citizen complaints — ${stats?.total || 0} total`}
          </p>
        </div>
        <div className="header-actions">
          {isUser && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={14} /> File Complaint
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-outline" onClick={async () => { await complaintAPI.checkOverdue(); fetchData(); }}>
              <Timer size={14} /> Check Overdue
            </button>
          )}
          <button className="btn btn-outline" onClick={fetchData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Admin Analytics */}
      {isAdmin && stats && (
        <>
          <div className="grid-5 mb-1">
            <div className="stat-card"><div className="stat-icon blue"><MessageSquare size={18} /></div><div className="stat-info"><span className="stat-value">{stats.total}</span><span className="stat-label">Total</span></div></div>
            <div className="stat-card"><div className="stat-icon amber"><Clock size={18} /></div><div className="stat-info"><span className="stat-value">{stats.open}</span><span className="stat-label">Open</span></div></div>
            <div className="stat-card"><div className="stat-icon cyan"><Zap size={18} /></div><div className="stat-info"><span className="stat-value">{stats.inProgress}</span><span className="stat-label">In Progress</span></div></div>
            <div className="stat-card"><div className="stat-icon green"><CheckCircle size={18} /></div><div className="stat-info"><span className="stat-value">{stats.resolved}</span><span className="stat-label">Resolved</span></div></div>
            <div className="stat-card"><div className="stat-icon red"><AlertTriangle size={18} /></div><div className="stat-info"><span className="stat-value">{stats.overdue}</span><span className="stat-label">Overdue</span></div></div>
          </div>

          <div className="charts-grid mb-1">
            <div className="card chart-section">
              <h3>By Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card chart-section">
              <h3>By Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusChartData} innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                    {statusChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {statusChartData.map(d => (
                  <span key={d.name} className="legend-item">
                    <span className="legend-dot" style={{ background: d.fill }} /> {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </div>
            <div className="card chart-section">
              <h3><Award size={14} /> Operator Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={perfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                  <Bar dataKey="resolved" fill="#10b981" radius={[6, 6, 0, 0]} name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
          <option value="">All Categories</option>
          {['traffic', 'water', 'waste', 'lighting', 'emergency'].map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Complaint Cards */}
      <div className="card-grid">
        {complaints.map(c => (
          <div key={c._id} className={`complaint-card priority-border-${c.priority} ${c.isOverdue ? 'overdue-card' : ''}`}>
            <div className="complaint-header">
              <h4>{c.title}</h4>
              <span className={`badge badge-${c.priority}`}>{c.priority}</span>
            </div>
            <div className="complaint-status-row">
              <span className="badge" style={{ background: `${STATUS_COLORS[c.status]}22`, color: STATUS_COLORS[c.status] }}>{c.status}</span>
              <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>{c.category}</span>
              {c.isOverdue && <span className="badge badge-red">⏰ OVERDUE</span>}
            </div>
            <p className="complaint-desc">{c.description}</p>
            <div className="item-details">
              <span><MapPin size={13} /> {c.location} ({c.zone})</span>
              <span><Clock size={13} /> Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
              {c.deadline && <span><Timer size={13} /> Deadline: {new Date(c.deadline).toLocaleDateString()}</span>}
              {c.createdBy && <span><User size={13} /> By: {c.createdBy.name}</span>}
              {c.assignedTo && <span><User size={13} /> Assigned: {c.assignedTo.name} ({c.assignedTo.department})</span>}
              {c.resolutionTimeMinutes && <span>⏱ Resolved in {c.resolutionTimeMinutes} min</span>}
            </div>
            {c.remarks && c.remarks.length > 0 && (
              <div className="remarks-section">
                <span className="remarks-title">Remarks:</span>
                {c.remarks.map((r, i) => (
                  <div key={i} className="remark-item">
                    <strong>{r.addedByName}</strong>: {r.text}
                    <span className="remark-time">{new Date(r.addedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="item-actions">
              {isAdmin && c.status !== 'resolved' && (
                <button className="btn btn-sm btn-primary" onClick={() => openAssign(c)}>
                  Assign Operator
                </button>
              )}
              {isOperator && c.status !== 'resolved' && (
                <button className="btn btn-sm btn-success" onClick={() => openStatusUpdate(c)}>
                  <ArrowRight size={13} /> {c.status === 'open' ? 'Start Progress' : 'Resolve'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {complaints.length === 0 && <div className="empty-state"><p>No complaints found</p></div>}

      {/* Create Complaint Modal (citizen) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>File a Complaint</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="input-group">
                <label>Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Brief title of compliant" />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {['traffic', 'water', 'waste', 'lighting', 'emergency'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required placeholder="Where is the issue?" />
              </div>
              <div className="input-group">
                <label>Zone</label>
                <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}>
                  {['north', 'south', 'east', 'west', 'central'].map(z => (
                    <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required placeholder="Describe the problem in detail..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Complaint</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal (admin) */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Assign Complaint</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowAssignModal(null)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <strong>{showAssignModal.title}</strong> — {showAssignModal.category}
            </p>

            {suggestions.length > 0 && (
              <div className="suggestions-box">
                <span className="suggestions-title">🤖 Smart Suggestions (least loaded first):</span>
                {suggestions.slice(0, 3).map(s => (
                  <button key={s.id} className={`suggestion-item ${assignForm.assignedTo === s.id ? 'selected' : ''}`}
                    onClick={() => setAssignForm(f => ({ ...f, assignedTo: s.id }))}>
                    <strong>{s.name}</strong> — {s.department} ({s.openAssignments} open)
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleAssign}>
              <div className="input-group">
                <label>Assign to Operator</label>
                <select value={assignForm.assignedTo} onChange={e => setAssignForm(f => ({ ...f, assignedTo: e.target.value }))} required>
                  <option value="">Select Operator</option>
                  {operators.map(op => (
                    <option key={op._id} value={op._id}>{op.name} ({op.department})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Priority</label>
                <select value={assignForm.priority} onChange={e => setAssignForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="input-group">
                <label>Deadline (optional)</label>
                <input type="datetime-local" value={assignForm.deadline} onChange={e => setAssignForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAssignModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal (operator) */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Update Status</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setShowStatusModal(null)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <strong>{showStatusModal.title}</strong> — changing to <span className="badge" style={{ background: `${STATUS_COLORS[statusForm.status]}22`, color: STATUS_COLORS[statusForm.status] }}>{statusForm.status}</span>
            </p>
            <form onSubmit={handleStatusUpdate}>
              <div className="input-group">
                <label>Add Remark</label>
                <textarea rows={3} value={statusForm.remark} onChange={e => setStatusForm(f => ({ ...f, remark: e.target.value }))} placeholder="What action was taken?" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowStatusModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-success"><CheckCircle size={14} /> Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
