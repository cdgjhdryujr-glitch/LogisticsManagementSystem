import { useState, useEffect } from 'react';
import {
  Package,
  Truck as TruckIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  BarChart3,
  Search,
  Eye,
  MapPin,
  Clock,
  Circle,
  X,
} from 'lucide-react';
import './styles/app.css';

interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'delayed';
  carrier: string;
  estimatedDelivery: string;
  weight: string;
  priority: 'standard' | 'express' | 'overnight';
}

interface Activity {
  id: string;
  type: 'shipment' | 'delivery' | 'alert';
  message: string;
  time: string;
}

const initialShipments: Shipment[] = [
  {
    id: '1',
    trackingNumber: 'TRK001234567',
    origin: 'New York, NY',
    destination: 'Los Angeles, CA',
    status: 'in-transit',
    carrier: 'FedEx',
    estimatedDelivery: 'Nov 5, 2025',
    weight: '5.2 kg',
    priority: 'express',
  },
  {
    id: '2',
    trackingNumber: 'TRK001234568',
    origin: 'Chicago, IL',
    destination: 'Houston, TX',
    status: 'delivered',
    carrier: 'GLT',
    estimatedDelivery: 'Nov 3, 2025',
    weight: '3.8 kg',
    priority: 'standard',
  },
];

const initialActivities: Activity[] = [
  {
    id: '1',
    type: 'delivery',
    message: 'Shipment TRK001234568 delivered to Houston, TX',
    time: '2 hours ago',
  },
];

export default function App() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

    // ---------- Safe storage helpers ----------
  const parseStorageResult = (data: any) => {
    if (data == null) return null;
    try {
      // some hosts return { value: '...json...' } and some return string directly
      if (typeof data === 'string') return JSON.parse(data);
      if (data.value) return JSON.parse(data.value);
      return data;
    } catch (e) {
      console.warn('parseStorageResult: non-json storage value', e);
      return data.value ?? data;
    }
  };

  const safeSetStorage = async (key: string, value: any) => {
    try {
      const payload = JSON.stringify(value);
      // try host-provided storage first
      if ((window as any).storage?.set) {
        await (window as any).storage.set(key, payload);
        return;
      }
      // fallback to localStorage
      localStorage.setItem(key, payload);
    } catch (err) {
      console.error('safeSetStorage failed', err);
    }
  };

  const safeGetStorage = async (key: string) => {
    try {
      if ((window as any).storage?.get) {
        const res = await (window as any).storage.get(key);
        if (res !== undefined) return parseStorageResult(res);
      }
    } catch (e) {
      // ignore and fallback
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  // ---------- load data (uses safeGetStorage) ----------
  const loadData = async () => {
    try {
      const shipmentsData = await safeGetStorage('logistics-shipments');
      const activitiesData = await safeGetStorage('logistics-activities');

      if (Array.isArray(shipmentsData)) {
        setShipments(shipmentsData);
      } else {
        setShipments(initialShipments);
        await safeSetStorage('logistics-shipments', initialShipments);
      }

      if (Array.isArray(activitiesData)) {
        setActivities(activitiesData);
      } else {
        setActivities(initialActivities);
        await safeSetStorage('logistics-activities', initialActivities);
      }
    } catch (error) {
      console.error('loadData error', error);
      setShipments(initialShipments);
      setActivities(initialActivities);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- save helpers (use safeSetStorage) ----------
  const saveShipments = async (newShipments: Shipment[]) => {
    try {
      await safeSetStorage('logistics-shipments', newShipments);
      setShipments(newShipments);
    } catch (error) {
      console.error('Failed to save shipments', error);
    }
  };

  const saveActivities = async (newActivities: Activity[]) => {
    try {
      await safeSetStorage('logistics-activities', newActivities);
      setActivities(newActivities);
    } catch (error) {
      console.error('Failed to save activities', error);
    }
  };

  // ---------- Live-data ingestion (SSE or window event fallback) ----------
  useEffect(() => {
    let es: EventSource | null = null;

    const handlePayload = (payload: any) => {
      if (!payload) return;
      // expected payload shapes:
      // { type: 'new-shipment', shipment: {...} }
      // { type: 'status-update', trackingNumber: 'TRK..', status: 'delayed' }
      if (payload.type === 'new-shipment' && payload.shipment) {
        const s: Shipment = payload.shipment;
        setShipments(prev => {
          const updated = [s, ...prev];
          safeSetStorage('logistics-shipments', updated).catch(console.error);
          return updated;
        });
        const act: Activity = {
          id: Date.now().toString(),
          type: 'shipment',
          message: `Live: New shipment ${s.trackingNumber} from ${s.origin}`,
          time: 'Just now',
        };
        setActivities(prev => {
          const updated = [act, ...prev];
          safeSetStorage('logistics-activities', updated).catch(console.error);
          return updated;
        });
      }

      if (payload.type === 'status-update' && payload.trackingNumber) {
        setShipments(prev => {
          const updated = prev.map(p =>
            p.trackingNumber === payload.trackingNumber ? { ...p, status: payload.status } : p
          );
          safeSetStorage('logistics-shipments', updated).catch(console.error);
          return updated;
        });
        const act: Activity = {
          id: Date.now().toString(),
          type: 'alert',
          message: `Status update: ${payload.trackingNumber} → ${payload.status}`,
          time: 'Just now',
        };
        setActivities(prev => {
          const updated = [act, ...prev];
          
          safeSetStorage('logistics-activities', updated).catch(console.error);
          return updated;
        });
      }
    };

    // If you provide a live URL via window.LIVE_DATA_URL it will connect via SSE
    if ((window as any).LIVE_DATA_URL) {
      try {
        es = new EventSource((window as any).LIVE_DATA_URL);
        es.onmessage = (e) => {
          try { handlePayload(JSON.parse(e.data)); } catch (err) { console.warn('invalid SSE payload', err); }
        };
        es.onerror = (err) => { console.warn('SSE error', err); };
      } catch (err) {
        console.warn('failed to open EventSource', err);
      }
    } else {
      // dev fallback: listen for custom window events
      const listener = (e: Event) => {
        handlePayload((e as CustomEvent).detail);
      };
      window.addEventListener('live-shipment', listener as EventListener);
      return () => window.removeEventListener('live-shipment', listener as EventListener);
    }

    return () => { if (es) es.close(); };
  }, []);


  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'in-transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
  };

  const getFilteredShipments = () => {
    let filtered = shipments;

    if (activeTab !== 'all') {
      filtered = filtered.filter(s => s.status === activeTab);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.destination.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

 const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDeleteShipment = (id: string) => {
    const shipmentToDelete = shipments.find(s => s.id === id);
    if (!shipmentToDelete) return;

    const ok = window.confirm(
      `Delete shipment ${shipmentToDelete.trackingNumber}? This action cannot be undone.`
    );
    if (!ok) return;
     setShipments(prev => {
      const updated = prev.filter(s => s.id !== id);
      safeSetStorage('logistics-shipments', updated).catch(console.error);
      return updated;
    });

     const activity: Activity = {
      id: Date.now().toString(),
      type: 'alert',
      message: `Deleted shipment ${shipmentToDelete.trackingNumber} (${shipmentToDelete.origin} → ${shipmentToDelete.destination})`,
      time: 'Just now',
    };

    setActivities(prev => {
      const updated = [activity, ...prev];
      safeSetStorage('logistics-activities', updated).catch(console.error);
      return updated;
    });

    if (selectedShipment?.id === id) {
      setSelectedShipment(null);
      setIsModalOpen(false);
    }
  };

  const handleAddShipment = (newShipment: Shipment) => {
    setShipments(prev => {
      const updated = [newShipment, ...prev];
      safeSetStorage('logistics-shipments', updated).catch(console.error);
      return updated;
    });
    

  setShipments(prev => {
      const updated = [newShipment, ...prev];
      safeSetStorage('logistics-shipments', updated).catch(console.error);
      return updated;
    });

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'shipment',
      message: `New shipment ${newShipment.trackingNumber} created from ${newShipment.origin}`,
      time: 'Just now',
    };

    setActivities(prev => {
      const updated = [newActivity, ...prev];
      safeSetStorage('logistics-activities', updated).catch(console.error);
      return updated;
    });

    setIsFormOpen(false);
  };

  const filteredShipments = getFilteredShipments();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{`
        /* Enhanced Button Styles */
        .btn-primary-new {
          position: relative;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-primary-new::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .btn-primary-new:hover::before {
          left: 100%;
        }

        .btn-primary-new:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .btn-secondary-new {
          padding: 0.75rem 1.5rem;
          background: white;
          color: #4a5568;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.25s ease;
          position: relative;
        }

        .btn-secondary-new::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }

        .btn-secondary-new:hover::after {
          width: 80%;
        }

        .btn-secondary-new:hover {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-1px);
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #4a5568;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }
      `}</style>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <Package />
            </div>
            <div className="header-title">
              <h1>LogisticsHub</h1>
              <p>Shipment Management System</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary-new">
              <BarChart3 size={18} />
              Reports
            </button>
            <button className="btn-primary-new" onClick={() => setIsFormOpen(true)}>
              <Plus size={18} />
              New Shipment
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Total Shipments</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-change positive">Live updating</div>
            </div>
            <div className="stat-icon blue">
              <Package />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">In Transit</div>
              <div className="stat-value">{stats.inTransit}</div>
              <div className="stat-change">{stats.inTransit} active shipments</div>
            </div>
            <div className="stat-icon orange">
              <TruckIcon />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Delivered</div>
              <div className="stat-value">{stats.delivered}</div>
              <div className="stat-change positive">Updates instantly</div>
            </div>
            <div className="stat-icon green">
              <CheckCircle2 />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Delayed</div>
              <div className="stat-value">{stats.delayed}</div>
              <div className="stat-change negative">{stats.delayed} issues</div>
            </div>
            <div className="stat-icon red">
              <AlertCircle />
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="layout-grid">
          {/* Shipments Table */}
          <div className="card">
            <div className="card-header">
              <h2>All Shipments</h2>
              <p>Track and manage all your shipments in one place</p>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <div className="tabs-list">
                <button
                  className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All ({stats.total})
                </button>
                <button
                  className={`tab ${activeTab === 'in-transit' ? 'active' : ''}`}
                  onClick={() => setActiveTab('in-transit')}
                >
                  In Transit ({stats.inTransit})
                </button>
                <button
                  className={`tab ${activeTab === 'delivered' ? 'active' : ''}`}
                  onClick={() => setActiveTab('delivered')}
                >
                  Delivered ({stats.delivered})
                </button>
                <button
                  className={`tab ${activeTab === 'delayed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('delayed')}
                >
                  Delayed ({stats.delayed})
                </button>
              </div>

              {/* Filters */}
              <div className="filters">
                <div className="search-box">
                  <Search />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by tracking number, origin, or destination..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>

              {/* Table */}
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tracking Number</th>
                      <th>Route</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Carrier</th>
                      <th>Weight</th>
                      <th>Est. Delivery</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty-state">No shipments found</div>
                        </td>
                      </tr>
                    ) : (
                      filteredShipments.map((shipment) => (
                        <tr key={shipment.id}>
                          <td>
                            <span className="tracking-number">{shipment.trackingNumber}</span>
                          </td>
                          <td>
                            <div className="route">
                              <span>{shipment.origin}</span>
                              <MapPin size={12} />
                              <span>{shipment.destination}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge status-${shipment.status}`}>
                              {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td>
                            <span className={`badge priority-${shipment.priority}`}>
                              {shipment.priority.charAt(0).toUpperCase() + shipment.priority.slice(1)}
                            </span>
                          </td>
                          <td>{shipment.carrier}</td>
                          <td>{shipment.weight}</td>
                          <td>{shipment.estimatedDelivery}</td>
                          <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
  <button
    className="btn-view"
    onClick={() => handleViewDetails(shipment)}
    title="View details"
    aria-label={`View ${shipment.trackingNumber}`}
  >
    <Eye size={16} /> View
  </button>

  <button
    className="btn-view"
    onClick={() => handleDeleteShipment(shipment.id)}
    title="Delete shipment"
    aria-label={`Delete ${shipment.trackingNumber}`}
    style={{ color: '#dc2626' }}
  >
    <X size={16} /> Delete
  </button>
</td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                Showing {filteredShipments.length} of {shipments.length} shipments
              </div>
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>
            <div className="activity-list">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === 'delivery' && <CheckCircle2 size={16} />}
                    {activity.type === 'shipment' && <Package size={16} />}
                    {activity.type === 'alert' && <AlertCircle size={16} />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-message">{activity.message}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))}
            
            </div>
          </div>
        </div>
      </main>

      {/* Shipment Details Modal */}
      {selectedShipment && (
        <TrackingModal
          shipment={selectedShipment}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* Add Shipment Form Modal */}
      {isFormOpen && (
        <ShipmentForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleAddShipment}
        />
      )}
    </div>
  );
}

// Shipment Form Component
function ShipmentForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (shipment: Shipment) => void }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    carrier: 'FedEx',
    weight: '',
    priority: 'standard' as 'standard' | 'express' | 'overnight',
    status: 'pending' as 'pending' | 'in-transit' | 'delivered' | 'delayed',
    estimatedDelivery: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newShipment: Shipment = {
      id: Date.now().toString(),
      trackingNumber: `TRK${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      ...formData,
    };
    
    onSubmit(newShipment);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h2>Add New Shipment</h2>
            <p>Fill in the details to create a new shipment</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Origin</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., New York, NY"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Destination</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Los Angeles, CA"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Carrier</label>
                <select
                  className="form-input"
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                >
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="DHL">DHL</option>
                  <option value="GLT">GLT</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Weight</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 5.2 kg"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-input"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="overnight">Overnight</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Delivery</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Nov 10, 2025"
                value={formData.estimatedDelivery}
                onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button type="button" className="btn-secondary-new" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary-new">
                <Plus size={18} />
                Create Shipment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Tracking Modal Component
function TrackingModal({ shipment, isOpen, onClose }: { shipment: Shipment; isOpen: boolean; onClose: () => void }) {
  const getTrackingEvents = () => {
    const baseEvents = [
      {
        timestamp: '2025-11-01 09:00 AM',
        location: shipment.origin,
        status: 'Order Placed',
        description: 'Package received at origin facility',
        completed: true,
      },
      {
        timestamp: '2025-11-01 02:30 PM',
        location: shipment.origin,
        status: 'Processing',
        description: 'Package sorted and prepared for shipment',
        completed: true,
      },
    ];

    if (shipment.status === 'in-transit' || shipment.status === 'delivered' || shipment.status === 'delayed') {
      baseEvents.push({
        timestamp: '2025-11-02 08:15 AM',
        location: 'Regional Hub',
        status: 'In Transit',
        description: 'Package in transit to destination',
        completed: true,
      });
    }

    if (shipment.status === 'delivered') {
      baseEvents.push({
        timestamp: '2025-11-03 11:45 AM',
        location: shipment.destination,
        status: 'Out for Delivery',
        description: 'Package out for delivery',
        completed: true,
      });
      baseEvents.push({
        timestamp: '2025-11-03 02:20 PM',
        location: shipment.destination,
        status: 'Delivered',
        description: 'Package delivered successfully',
        completed: true,
      });
    } else if (shipment.status === 'delayed') {
      baseEvents.push({
        timestamp: '2025-11-03 09:00 AM',
        location: 'Regional Hub',
        status: 'Delayed',
        description: 'Package delayed due to weather conditions',
        completed: true,
      });
      baseEvents.push({
        timestamp: 'Expected: ' + shipment.estimatedDelivery,
        location: shipment.destination,
        status: 'Pending',
        description: 'Estimated delivery',
        completed: false,
      });
    } else {
      baseEvents.push({
        timestamp: 'Expected: ' + shipment.estimatedDelivery,
        location: shipment.destination,
        status: 'Pending',
        description: 'Estimated delivery',
        completed: false,
      });
    }

    return baseEvents;
  };

  const trackingEvents = getTrackingEvents();

  return (
    <div className={`modal-overlay ${!isOpen ? 'hidden' : ''}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Shipment Details</h2>
            <p>View detailed tracking information and history for this shipment</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <div className="info-grid">
              <div className="info-item">
                <label>Tracking Number</label>
                <p className="tracking-number">{shipment.trackingNumber}</p>
              </div>
              <div className="info-item">
                <label>Carrier</label>
                <p>{shipment.carrier}</p>
              </div>
              <div className="info-item">
                <label>Origin</label>
                <p>{shipment.origin}</p>
              </div>
              <div className="info-item">
                <label>Destination</label>
                <p>{shipment.destination}</p>
              </div>
              <div className="info-item">
                <label>Weight</label>
                <p>{shipment.weight}</p>
              </div>
              <div className="info-item">
                <label>Estimated Delivery</label>
                <p>{shipment.estimatedDelivery}</p>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <div className="status-section">
              <Package />
              <div className="status-content">
                <div className="status-label">Current Status</div>
                <div className="status-badges">
                  <span className={`badge status-${shipment.status}`}>
                    {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1).replace('-', ' ')}
                  </span>
                  <span className={`badge priority-${shipment.priority}`}>
                    {shipment.priority.charAt(0).toUpperCase() + shipment.priority.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <div className="timeline-header">Tracking History</div>
            <div className="timeline">
              {trackingEvents.map((event, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker">
                    <div className={`timeline-icon ${event.completed ? 'completed' : 'pending'}`}>
                      {event.completed ? <CheckCircle2 /> : <Circle />}
                    </div>
                    {index < trackingEvents.length - 1 && (
                      <div className={`timeline-line ${event.completed ? 'completed' : 'pending'}`} />
                    )}
                  </div>
                  <div className="timeline-content">
                    <div className={`timeline-status ${event.completed ? '' : 'pending'}`}>
                      {event.status}
                    </div>
                    <div className="timeline-description">{event.description}</div>
                    <div className="timeline-meta">
                      <span>
                        <Clock />
                        {event.timestamp}
                      </span>
                      <span>
                        <MapPin />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}