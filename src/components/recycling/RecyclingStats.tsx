import React, { useState } from 'react';
import { BarChart3, TrendingUp, Award, Leaf, Calendar } from 'lucide-react';
import { mockRecyclingStats } from '../../data/mockData';

const RecyclingStats: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  
  const stats = mockRecyclingStats;
  
  const materials = [
    { type: 'Plastic', weight: stats.plasticWeight, color: 'bg-blue-500', icon: '♻️' },
    { type: 'Paper', weight: stats.paperWeight, color: 'bg-green-500', icon: '📄' },
    { type: 'Glass', weight: stats.glassWeight, color: 'bg-purple-500', icon: '🍶' },
    { type: 'Metal', weight: stats.metalWeight, color: 'bg-gray-500', icon: '🥫' },
  ];

  const achievements = [
    { id: 1, title: 'Eco Warrior', description: 'Recycled 25kg this month', earned: true },
    { id: 2, title: 'Planet Protector', description: 'Saved 15kg of CO₂', earned: true },
    { id: 3, title: 'Green Champion', description: 'Recycled for 30 consecutive days', earned: false },
    { id: 4, title: 'Zero Waste', description: 'Achieved 90% recycling rate', earned: false },
  ];

  const monthlyTrend = [
    { month: 'Jan', weight: 22.5 },
    { month: 'Feb', weight: 25.1 },
    { month: 'Mar', weight: 28.3 },
    { month: 'Apr', weight: 26.8 },
    { month: 'May', weight: 29.7 },
  ];

  const maxWeight = Math.max(...materials.map(m => m.weight));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recycling Statistics</h1>
          <p className="text-gray-600">Track your environmental impact and recycling performance.</p>
        </div>
        
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as 'weekly' | 'monthly' | 'yearly')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
          <option value="yearly">This Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Recycled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWeight} kg</p>
              <p className="text-sm text-green-600">+12% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Leaf className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">CO₂ Saved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.co2Saved} kg</p>
              <p className="text-sm text-blue-600">+8% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Achievements</p>
              <p className="text-2xl font-bold text-gray-900">
                {achievements.filter(a => a.earned).length}/{achievements.length}
              </p>
              <p className="text-sm text-purple-600">2 earned this month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Breakdown</h3>
          <div className="space-y-4">
            {materials.map((material) => (
              <div key={material.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{material.icon}</span>
                    <span className="font-medium text-gray-900">{material.type}</span>
                  </div>
                  <span className="text-sm text-gray-600">{material.weight} kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${material.color}`}
                    style={{ width: `${(material.weight / maxWeight) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="font-medium text-green-900">Great Progress!</p>
                <p className="text-sm text-green-700">You're recycling 15% more than the average household.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
          <div className="space-y-4">
            {monthlyTrend.map((month) => (
              <div key={month.month} className="flex items-center space-x-4">
                <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(month.weight / 35) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">{month.weight} kg</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-colors ${
                achievement.earned
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  achievement.earned ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  <Award className={`h-6 w-6 ${
                    achievement.earned ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <h4 className={`font-medium ${
                  achievement.earned ? 'text-green-900' : 'text-gray-600'
                }`}>
                  {achievement.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                {achievement.earned && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Earned
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.co2Saved}</div>
            <div className="text-green-100">kg CO₂ saved</div>
            <div className="text-sm text-green-200 mt-1">Equivalent to planting 2 trees</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">847</div>
            <div className="text-blue-100">liters water saved</div>
            <div className="text-sm text-blue-200 mt-1">From recycling paper</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">23</div>
            <div className="text-purple-100">kWh energy saved</div>
            <div className="text-sm text-purple-200 mt-1">From recycling materials</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecyclingStats;