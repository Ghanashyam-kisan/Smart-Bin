import React from 'react';
import { Truck, MapPin, AlertTriangle, Users, Calendar, TrendingUp } from 'lucide-react';
import StatCard from '../common/StatCard';
import { mockBins, mockPickupRequests, mockReports } from '../../data/mockData';

const AuthorityDashboard: React.FC = () => {
  const totalBins = mockBins.length;
  const overflowingBins = mockBins.filter(bin => bin.status === 'overflowing').length;
  const pendingReports = mockReports.filter(report => report.status === 'open').length;
  const scheduledPickups = mockPickupRequests.filter(req => req.status === 'scheduled').length;

  const urgentAlerts = [
    { id: 1, message: 'Recycling bin overflowing at Park Ave', priority: 'high', time: '30 min ago' },
    { id: 2, message: 'Route 5 delayed due to traffic', priority: 'medium', time: '1 hour ago' },
    { id: 3, message: 'Maintenance required for bin #456', priority: 'low', time: '2 hours ago' },
  ];

  const collectionStats = [
    { route: 'Route A', completed: 15, total: 20, efficiency: 75 },
    { route: 'Route B', completed: 18, total: 22, efficiency: 82 },
    { route: 'Route C', completed: 12, total: 16, efficiency: 75 },
    { route: 'Route D', completed: 20, total: 24, efficiency: 83 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Authority Dashboard</h1>
        <p className="text-gray-600">Monitor and manage waste collection operations across the city.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bins"
          value={totalBins}
          icon={MapPin}
          color="green"
        />
        <StatCard
          title="Overflowing Bins"
          value={overflowingBins}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Scheduled Pickups"
          value={scheduledPickups}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Pending Reports"
          value={pendingReports}
          icon={Users}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Urgent Alerts</h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {urgentAlerts.length} Active
            </span>
          </div>
          <div className="space-y-4">
            {urgentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-1 rounded-full ${
                  alert.priority === 'high' ? 'bg-red-100' :
                  alert.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${
                    alert.priority === 'high' ? 'text-red-600' :
                    alert.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                      alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.priority} priority
                    </span>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Collection Efficiency</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-4">
            {collectionStats.map((stat) => (
              <div key={stat.route} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{stat.route}</span>
                  <span className="text-sm text-gray-600">{stat.completed}/{stat.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stat.efficiency}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{stat.efficiency}% complete</span>
                  <span className={stat.efficiency >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                    {stat.efficiency >= 80 ? 'On track' : 'Behind schedule'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Truck className="h-6 w-6 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-900">Schedule Route</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <MapPin className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">View Map</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <AlertTriangle className="h-6 w-6 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-orange-900">Handle Reports</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Users className="h-6 w-6 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-900">Manage Users</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;