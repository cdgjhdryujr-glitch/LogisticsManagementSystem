import { Card } from './ui/card';
import { Package, TruckIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'shipment' | 'delivery' | 'alert';
  message: string;
  time: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'shipment':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'delivery':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 items-start">
            <div className="mt-0.5">{getIcon(activity.type)}</div>
            <div className="flex-1">
              <p className="text-sm">{activity.message}</p>
              <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
