import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import ResidentDashboard from './components/dashboard/ResidentDashboard';
import AuthorityDashboard from './components/dashboard/AuthorityDashboard';
import SchedulePickup from './components/schedule/SchedulePickup';
import BinMap from './components/bins/BinMap';
import ReportIssue from './components/reports/ReportIssue';
import RecyclingStats from './components/recycling/RecyclingStats';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'dashboard':
        return user.role === 'authority' ? <AuthorityDashboard /> : <ResidentDashboard />;
      case 'schedule':
        return user.role === 'resident' ? <SchedulePickup /> : null;
      case 'bins':
        return <BinMap />;
      case 'reports':
        return <ReportIssue />;
      case 'recycling':
        return user.role === 'resident' ? <RecyclingStats /> : null;
      case 'routes':
        return user.role === 'authority' ? <div className="text-center py-12 text-gray-500">Collection Routes - Coming Soon</div> : null;
      case 'analytics':
        return user.role === 'authority' ? <div className="text-center py-12 text-gray-500">Analytics - Coming Soon</div> : null;
      case 'users':
        return user.role === 'authority' ? <div className="text-center py-12 text-gray-500">User Management - Coming Soon</div> : null;
      case 'settings':
        return <div className="text-center py-12 text-gray-500">Settings - Coming Soon</div>;
      default:
        return user.role === 'authority' ? <AuthorityDashboard /> : <ResidentDashboard />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SmartBin</h1>
          <p className="text-gray-600 mb-8">Please log in to continue</p>
          <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        isMenuOpen={sidebarOpen}
      />
      
      <div className="flex">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;