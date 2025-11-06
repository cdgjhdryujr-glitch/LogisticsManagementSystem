import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Package, MapPin, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Shipment } from './ShipmentTable';

interface TrackingDialogProps {
  shipment: Shipment | null;
  open: boolean;
  onClose: () => void;
}

interface TrackingEvent {
  timestamp: string;
  location: string;
  status: string;
  description: string;
  completed: boolean;
}

export function TrackingDialog({ shipment, open, onClose }: TrackingDialogProps) {
  if (!shipment) return null;

  // Mock tracking events based on status
  const getTrackingEvents = (): TrackingEvent[] => {
    const baseEvents: TrackingEvent[] = [
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Shipment Details</DialogTitle>
          <DialogDescription>
            View detailed tracking information and history for this shipment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shipment Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Tracking Number</p>
              <p className="font-mono">{shipment.trackingNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Carrier</p>
              <p>{shipment.carrier}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Origin</p>
              <p>{shipment.origin}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Destination</p>
              <p>{shipment.destination}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Weight</p>
              <p>{shipment.weight}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Delivery</p>
              <p>{shipment.estimatedDelivery}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Current Status</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={
                  shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  shipment.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                  shipment.status === 'delayed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1).replace('-', ' ')}
                </Badge>
                <Badge className={
                  shipment.priority === 'overnight' ? 'bg-purple-100 text-purple-800' :
                  shipment.priority === 'express' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-700'
                }>
                  {shipment.priority.charAt(0).toUpperCase() + shipment.priority.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div>
            <p className="mb-4">Tracking History</p>
            <div className="space-y-4">
              {trackingEvents.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {event.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                    {index < trackingEvents.length - 1 && (
                      <div className={`w-0.5 h-12 ${event.completed ? 'bg-green-600' : 'bg-gray-300'}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={event.completed ? '' : 'text-gray-500'}>{event.status}</p>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.timestamp}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
