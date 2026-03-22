import { useState, useEffect } from 'react';
import { wasteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Trash2, MapPin, Truck, AlertCircle, Route,
  RefreshCw, CheckCircle, X
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import './ModulePage.css';

const Waste = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ zone: '', fillStatus: '' });
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      const params = {};
      if (filter.zone) params.zone = filter.zone;
      if (filter.fillStatus) params.fillStatus = filter.fillStatus;
      const [dataRes, statsRes] = await Promise.all([
        wasteAPI.getAll(params),
        wasteAPI.getStats()
      ]);
      setData(dataRes.data.data);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Waste fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleCollect = async (id) => {
    try {
      await wasteAPI.collect(id);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleOptimizeRoutes = async (zone) => {
    try {
      await wasteAPI.optimizeRoutes(zone);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDetectMissed = async () => {
    try {
      await wasteAPI.detectMissed();
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  const getFillColor = (level) => {
    if (level >= 70) return '#ef4444';
    if (level >= 30) return '#f59e0b';
    return '#10b981';
  };

  const pieData = [
    { name: 'Full', value: stats?.overall?.fullBins || 0, color: '#ef4444' },
    { name: 'Half', value: stats?.overall?.totalBins - (stats?.overall?.fullBins || 0) - (stats?.overall?.missedPickups || 0) || 0, color: '#f59e0b' },
    { name: 'Empty', value: stats?.overall?.totalBins - (stats?.overall?.fullBins || 0) || 0, color: '#10b981' },
  ];

  return (
    <div className="module-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>🗑️ Waste Management</h1>
          <p>Monitor bin levels, manage collection, and optimize routes</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleDetectMissed}>
            <AlertCircle size={14} /> Detect Missed
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => handleOptimizeRoutes(filter.zone || 'central')}>
              <Route size={14} /> Optimize Routes
            </button>
          )}
          <button className="btn btn-outline" onClick={fetchData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-1">
        <div className="stat-card">
          <div className="stat-icon green"><Trash2 size={18} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.overall?.totalBins || 0}</span>
            <span className="stat-label">Total Bins</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertCircle size={18} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.overall?.fullBins || 0}</span>
            <span className="stat-label">Full Bins</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Truck size={18} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.overall?.pendingCollection || 0}</span>
            <span className="stat-label">Pending Collection</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><AlertCircle size={18} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.overall?.missedPickups || 0}</span>
            <span className="stat-label">Missed Pickups</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select value={filter.zone} onChange={e => setFilter(f => ({ ...f, zone: e.target.value }))}>
          <option value="">All Zones</option>
          {['north', 'south', 'east', 'west', 'central'].map(z => (
            <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>
          ))}
        </select>
        <select value={filter.fillStatus} onChange={e => setFilter(f => ({ ...f, fillStatus: e.target.value }))}>
          <option value="">All Levels</option>
          <option value="empty">Empty</option>
          <option value="half">Half</option>
          <option value="full">Full</option>
        </select>
      </div>

      {/* Bin Cards */}
      <div className="card-grid">
        {data.map(bin => (
          <div key={bin._id} className="bin-card">
            <div className="item-header">
              <h4>{bin.binId}</h4>
              <span className={`badge badge-${bin.fillStatus}`}>{bin.fillStatus}</span>
            </div>
            <div className="fill-bar">
              <div
                className="fill-bar-inner"
                style={{ width: `${bin.fillLevel}%`, background: getFillColor(bin.fillLevel) }}
              />
            </div>
            <div className="item-details">
              <span><MapPin size={13} /> {bin.location}</span>
              <span>Zone: {bin.zone} | Fill: {bin.fillLevel}%</span>
              <span>Type: {bin.wasteType} | Status: {bin.collectionStatus}</span>
              {bin.missedPickup && <span style={{ color: 'var(--accent-red)' }}>⚠ Missed Pickup</span>}
              {bin.lastCollected && <span>Last: {new Date(bin.lastCollected).toLocaleDateString()}</span>}
            </div>
            <div className="item-actions">
              <button className="btn btn-sm btn-success" onClick={() => handleCollect(bin._id)}>
                <CheckCircle size={13} /> Collect
              </button>
            </div>
          </div>
        ))}
      </div>
      {data.length === 0 && <div className="empty-state"><p>No waste bins found</p></div>}
    </div>
  );
};

export default Waste;
