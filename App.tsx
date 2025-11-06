import { useState } from 'react';
import {
  Package,
  TruckIcon,
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

const mockShipments: Shipment[] = [
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
    carrier: 'UPS',
    estimatedDelivery: 'Nov 3, 2025',
    weight: '3.8 kg',
    priority: 'standard',
  },
  {
    id: '3',
    trackingNumber: 'TRK001234569',
    origin: 'Seattle, WA',
    destination: 'Miami, FL',
    status: 'pending',
    carrier: 'DHL',
    estimatedDelivery: 'Nov 7, 2025',
    weight: '12.5 kg',
    priority: 'overnight',
  },
  {
    id: '4',
    trackingNumber: 'TRK001234570',
    origin: 'Boston, MA',
    destination: 'Denver, CO',
    status: 'in-transit',
    carrier: 'FedEx',
    estimatedDelivery: 'Nov 6, 2025',
    weight: '7.1 kg',
    priority: 'express',
  },
  {
    id: '5',
    trackingNumber: 'TRK001234571',
    origin: 'Phoenix, AZ',
    destination: 'Atlanta, GA',
    status: 'delayed',
    carrier: 'UPS',
    estimatedDelivery: 'Nov 8, 2025',
    weight: '4.3 kg',
    priority: 'standard',
  },
  {
    id: '6',
    trackingNumber: 'TRK001234572',
    origin: 'San Francisco, CA',
    destination: 'Portland, OR',
    status: 'delivered',
    carrier: 'DHL',
    estimatedDelivery: 'Nov 2, 2025',
    weight: '2.9 kg',
    priority: 'overnight',
  },
  {
    id: '7',
    trackingNumber: 'TRK001234573',
    origin: 'Dallas, TX',
    destination: 'Philadelphia, PA',
    status: 'in-transit',
    carrier: 'FedEx',
    estimatedDelivery: 'Nov 5, 2025',
    weight: '8.7 kg',
    priority: 'express',
  },
  {
    id: '8',
    trackingNumber: 'TRK001234574',
    origin: 'Las Vegas, NV',
    destination: 'Charlotte, NC',
    status: 'pending',
    carrier: 'UPS',
    estimatedDelivery: 'Nov 9, 2025',
    weight: '6.4 kg',
    priority: 'standard',
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'delivery',
    message: 'Shipment TRK001234568 delivered to Houston, TX',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'alert',
    message: 'Shipment TRK001234571 delayed due to weather conditions',
    time: '4 hours ago',
  },
  {
    id: '3',
    type: 'shipment',
    message: 'New shipment TRK001234574 created from Las Vegas, NV',
    time: '5 hours ago',
  },
  {
    id: '4',
    type: 'delivery',
    message: 'Shipment TRK001234572 delivered to Portland, OR',
    time: '1 day ago',
  },
  {
    id: '5',
    type: 'shipment',
    message: 'Shipment TRK001234573 in transit from Dallas, TX',
    time: '1 day ago',
  },
];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stats = {
    total: mockShipments.length,
    inTransit: mockShipments.filter(s => s.status === 'in-transit').length,
    delivered: mockShipments.filter(s => s.status === 'delivered').length,
    delayed: mockShipments.filter(s => s.status === 'delayed').length,
  };

  const getFilteredShipments = () => {
    let filtered = mockShipments;

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

  const filteredShipments = getFilteredShipments();

  return (
    <div className="app">
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
            <button className="btn btn-secondary">
              <BarChart3 />
              Reports
            </button>
            <button className="btn btn-primary">
              <Plus />
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
              <div className="stat-change positive">+12% from last month</div>
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
              <div className="stat-change positive">+8% from last month</div>
            </div>
            <div className="stat-icon green">
              <CheckCircle2 />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Delayed</div>
              <div className="stat-value">{stats.delayed}</div>
              <div className="stat-change negative">-3% from last month</div>
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
                              <MapPin />
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
                          <td>
                            <button
                              className="btn-view"
                              onClick={() => handleViewDetails(shipment)}
                            >
                              <Eye />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                Showing {filteredShipments.length} of {mockShipments.length} shipments
              </div>
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>
            <div className="activity-list">
              {mockActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === 'delivery' && <CheckCircle2 />}
                    {activity.type === 'shipment' && <Package />}
                    {activity.type === 'alert' && <AlertCircle />}
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

      {/* Modal */}
      {selectedShipment && (
        <TrackingModal
          shipment={selectedShipment}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
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
          {/* Shipment Info */}
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

          {/* Current Status */}
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

          {/* Tracking Timeline */}
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
