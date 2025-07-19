import React, { useState } from 'react';
import { MapPin, Navigation, Filter, Search } from 'lucide-react';
import { mockBins } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

const BinMap: React.FC = () => {
  const { user } = useAuth();
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBins = mockBins.filter(bin => {
    const matchesStatus = statusFilter === 'all' || bin.status === statusFilter;
    const matchesType = typeFilter === 'all' || bin.type === typeFilter;
    const matchesSearch = bin.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty': return 'bg-green-500';
      case 'half-full': return 'bg-yellow-500';
      case 'full': return 'bg-orange-500';
      case 'overflowing': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recycling': return '♻️';
      case 'organic': return '🌱';
      default: return '🗑️';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'authority' ? 'All Bins' : 'My Bins'}
        </h1>
        <p className="text-gray-600">
          {user?.role === 'authority' 
            ? 'Monitor and manage all waste bins across the city.' 
            : 'View and manage your waste bins.'
          }
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="half-full">Half Full</option>
            <option value="full">Full</option>
            <option value="overflowing">Overflowing</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="recycling">Recycling</option>
            <option value="organic">Organic</option>
          </select>

          <button className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            <Filter className="h-5 w-5 mr-2" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-96">
            <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center relative overflow-hidden">
              <div className="text-center z-10">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Interactive Map</p>
                <p className="text-sm text-gray-500">Bin locations would be displayed here</p>
              </div>
              
              {/* Simulated map pins */}
              <div className="absolute inset-0">
                {filteredBins.map((bin, index) => (
                  <div
                    key={bin.id}
                    className={`absolute w-6 h-6 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${getStatusColor(bin.status)} opacity-80 hover:opacity-100 transition-opacity`}
                    style={{
                      left: `${20 + index * 25}%`,
                      top: `${30 + (index % 3) * 20}%`
                    }}
                    onClick={() => setSelectedBin(selectedBin === bin.id ? null : bin.id)}
                  >
                    <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center text-white text-xs">
                      {getTypeIcon(bin.type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bin List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Bins ({filteredBins.length})
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredBins.map((bin) => (
              <div
                key={bin.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedBin === bin.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedBin(selectedBin === bin.id ? null : bin.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-3 ${getStatusColor(bin.status)}`} />
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {getTypeIcon(bin.type)} {bin.type} Bin
                      </p>
                      <p className="text-sm text-gray-600">{bin.location.address}</p>
                      <p className="text-xs text-gray-500">
                        Next pickup: {new Date(bin.nextPickup).toLocaleDateString()}
                      </p>
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
                
                {selectedBin === bin.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Last emptied:</span> {new Date(bin.lastEmptied).toLocaleDateString()}</p>
                      <p><span className="font-medium">Location:</span> {bin.location.lat.toFixed(4)}, {bin.location.lng.toFixed(4)}</p>
                      {bin.reportedIssues && bin.reportedIssues.length > 0 && (
                        <div className="bg-red-50 p-2 rounded border border-red-200">
                          <p className="font-medium text-red-800">Reported Issues:</p>
                          <ul className="text-red-700 text-xs mt-1">
                            {bin.reportedIssues.map((issue, index) => (
                              <li key={index}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex space-x-2 mt-3">
                        <button className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-xs hover:bg-green-700 transition-colors">
                          Schedule Pickup
                        </button>
                        <button className="flex-1 bg-orange-600 text-white py-1 px-3 rounded text-xs hover:bg-orange-700 transition-colors">
                          Report Issue
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinMap;