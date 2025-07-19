import React from 'react';
import { Calendar, MapPin, AlertTriangle, Recycle, Clock, CheckCircle } from 'lucide-react';
import StatCard from '../common/StatCard';
import { mockBins, mockPickupRequests, mockRecyclingStats } from '../../data/mockData';

const ResidentDashboard: React.FC = () => {
  const nextPickup = mockPickupRequests.find(req => req.status === 'scheduled');
  const pendingRequests = mockPickupRequests.filter(req => req.status === 'pending').length;
  const myBins = mockBins.length;
  const recyclingTotal = mockRecyclingStats.totalWeight;

  const recentActivity = [
    { id: 1, action: 'Pickup scheduled', bin: 'Recycling Bin - Park Ave', time: '2 hours ago', status: 'scheduled' },
    { id: 2, action: 'Report submitted', bin: 'General Bin - Main St', time: '1 day ago', status: 'pending' },
    { id: 3, action: 'Pickup completed', bin: 'Organic Bin - Broadway', time: '3 days ago', status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your waste management.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Bins"
          value={myBins}
          icon={MapPin}
          color="green"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Monthly Recycling"
          value={`${recyclingTotal} kg`}
          icon={Recycle}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="CO₂ Saved"
          value={`${mockRecyclingStats.co2Saved} kg`}
          icon={CheckCircle}
          trend={{ value: 8, isPositive: true }}
          color="purple"
        />
      </div>

      {/* Next Pickup Card */}
      {nextPickup && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Next Scheduled Pickup</h3>
              <p className="text-gray-600">
                Your recycling bin pickup is scheduled for {new Date(nextPickup.requestedDate).toLocaleDateString()}
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                High Priority
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bin Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bin Status</h3>
          <div className="space-y-4">
            {mockBins.map((bin) => (
              <div key={bin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    bin.status === 'empty' ? 'bg-green-400' :
                    bin.status === 'half-full' ? 'bg-yellow-400' :
                    bin.status === 'full' ? 'bg-orange-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{bin.type} Bin</p>
                    <p className="text-sm text-gray-600">{bin.location.address}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                  bin.status === 'empty' ? 'bg-green-100 text-green-800' :
                  bin.status === 'half-full' ? 'bg-yellow-100 text-yellow-800' :
                  bin.status === 'full' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                }`}>
                  {bin.status.replace('-', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-1 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-100' :
                  activity.status === 'scheduled' ? 'bg-blue-100' : 'bg-yellow-100'
                }`}>
                  {activity.status === 'completed' ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> :
                    activity.status === 'scheduled' ?
                    <Calendar className="h-4 w-4 text-blue-600" /> :
                    <Clock className="h-4 w-4 text-yellow-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.bin}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;