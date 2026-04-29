import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  Server, 
  Search, 
  Filter,
  RefreshCw,
  Bell,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const ALERT_BASE = import.meta.env.VITE_ALERT_URL || 'http://localhost:5002/api';

function App() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ levelStats: [], serviceHealth: [] });
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [filters, setFilters] = useState({ service: '', level: '', search: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // New Rule Form State
  const [newRule, setNewRule] = useState({ name: '', type: 'ERROR_COUNT', threshold: 10, windowMinutes: 1, email: '' });

  const fetchData = async () => {
    try {
      const logsRes = await axios.get(`${API_BASE}/logs`, { params: filters });
      const statsRes = await axios.get(`${API_BASE}/logs/stats`);
      const alertsRes = await axios.get(`${ALERT_BASE}/alerts`);
      const rulesRes = await axios.get(`${ALERT_BASE}/alerts/rules`);
      
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
      setRules(rulesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [filters]);

  const resolveAlert = async (id) => {
    try {
      await axios.post(`${ALERT_BASE}/alerts/${id}/resolve`);
      fetchData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const addRule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${ALERT_BASE}/alerts/rules`, newRule);
      setNewRule({ name: '', type: 'ERROR_COUNT', threshold: 10, windowMinutes: 1, email: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding rule:', error);
    }
  };

  const deleteRule = async (id) => {
    try {
      await axios.delete(`${ALERT_BASE}/alerts/rules/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const downloadCSV = () => {
    window.open(`${API_BASE}/logs/download`, '_blank');
  };

  const chartData = {
    labels: stats.levelStats.map(s => s._id),
    datasets: [{
      label: 'Log Levels',
      data: stats.levelStats.map(s => s.count),
      backgroundColor: [
        'rgba(59, 130, 246, 0.6)', 
        'rgba(245, 158, 11, 0.6)', 
        'rgba(239, 68, 68, 0.6)',  
        'rgba(148, 163, 184, 0.6)' 
      ],
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }]
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <Activity size={28} />
          <span>ObserveFlow</span>
        </div>
        
        <ul className="nav-links">
          <li 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} /> Dashboard
          </li>
          <li 
            className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <Bell size={20} /> Alerts ({alerts.filter(a => a.status === 'ACTIVE').length})
          </li>
          <li 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} /> Admin Panel
          </li>
        </ul>

        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          <div className="stat-label">System Status</div>
          <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
            All Systems Operational
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>{activeTab === 'settings' ? 'Admin Panel' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
              <p style={{ color: 'var(--text-muted)' }}>Real-time system observability</p>
            </div>
            <button 
              onClick={downloadCSV}
              style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> Export Logs CSV
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="fade-in">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Logs (24h)</div>
                <div className="stat-value">{stats.levelStats.reduce((a, b) => a + b.count, 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Error Count</div>
                <div className="stat-value" style={{ color: 'var(--error)' }}>
                  {stats.levelStats.find(s => s._id === 'ERROR')?.count || 0}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Warning Count</div>
                <div className="stat-value" style={{ color: 'var(--warn)' }}>
                  {stats.levelStats.find(s => s._id === 'WARN')?.count || 0}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Services Online</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>
                  {stats.serviceHealth.length} / 4
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-container">
                <h3>Log Level Distribution</h3>
                <div style={{ height: '300px', marginTop: '1rem' }}>
                  <Bar data={chartData} options={{ maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="chart-container">
                <h3>Service Status</h3>
                <div style={{ marginTop: '1rem' }}>
                  {stats.serviceHealth.map(s => (
                    <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className="service-id">{s._id}</span>
                      <span className="badge badge-info">Healthy</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Log Table */}
            <div className="log-table-container">
              <div className="table-header">
                <h3>Recent Logs</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search logs..." 
                      style={{ padding: '0.5rem 1rem 0.5rem 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                  </div>
                  <select 
                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}
                    onChange={(e) => setFilters({...filters, level: e.target.value})}
                  >
                    <option value="">All Levels</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Service</th>
                    <th>Level</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="service-id">{log.serviceId}</td>
                      <td>
                        <span className={`badge badge-${log.logLevel.toLowerCase()}`}>
                          {log.logLevel}
                        </span>
                      </td>
                      <td className="message">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="fade-in">
            <div className="log-table-container">
              <div className="table-header">
                <h3>Active Alerts</h3>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Service</th>
                    <th>Message</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(alert => (
                    <tr key={alert._id}>
                      <td className="timestamp">{new Date(alert.timestamp).toLocaleString()}</td>
                      <td className="service-id">{alert.serviceId || 'System'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertTriangle size={16} color="var(--error)" />
                          {alert.message}
                        </div>
                      </td>
                      <td>
                        {alert.status === 'ACTIVE' ? (
                          <button 
                            onClick={() => resolveAlert(alert._id)}
                            style={{ padding: '0.5rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer' }}
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="badge badge-info">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="fade-in">
             <div className="chart-container" style={{ marginBottom: '2rem' }}>
                <h3>Alert Rules Management</h3>
                <form onSubmit={addRule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                  <input 
                    type="text" placeholder="Rule Name" required
                    value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})}
                    style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}
                  />
                  <select 
                    value={newRule.type} onChange={e => setNewRule({...newRule, type: e.target.value})}
                    style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}
                  >
                    <option value="ERROR_COUNT">Error Count</option>
                    <option value="HEARTBEAT">Heartbeat</option>
                  </select>
                  <input 
                    type="number" placeholder="Threshold" required
                    value={newRule.threshold} onChange={e => setNewRule({...newRule, threshold: e.target.value})}
                    style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}
                  />
                  <input 
                    type="email" placeholder="Email" required
                    value={newRule.email} onChange={e => setNewRule({...newRule, email: e.target.value})}
                    style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'white' }}
                  />
                  <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.75rem', cursor: 'pointer' }}>
                    Add Rule
                  </button>
                </form>
             </div>

             <div className="log-table-container">
               <table>
                 <thead>
                   <tr>
                     <th>Name</th>
                     <th>Type</th>
                     <th>Threshold</th>
                     <th>Email</th>
                     <th>Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {rules.map(rule => (
                     <tr key={rule._id}>
                       <td style={{ fontWeight: 600 }}>{rule.name}</td>
                       <td>{rule.type}</td>
                       <td>{rule.threshold} / {rule.windowMinutes}m</td>
                       <td>{rule.email}</td>
                       <td>
                         <button 
                          onClick={() => deleteRule(rule._id)}
                          style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'none', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                         >
                           Delete
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
