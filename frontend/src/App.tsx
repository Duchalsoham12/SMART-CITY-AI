import React, { useState } from 'react';
import { PageId, Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { setLiveMode } from './services/apiClient';

// Pages
import { ExecutiveOverview } from './pages/ExecutiveOverview';
import { TrafficIntelligence } from './pages/TrafficIntelligence';
import { EnvironmentalIntelligence } from './pages/EnvironmentalIntelligence';
import { SafetyAndRisk } from './pages/SafetyAndRisk';
import { GeospatialExplorer } from './pages/GeospatialExplorer';
import { ForecastingPage } from './pages/ForecastingPage';
import { AnomalyDetectionPage } from './pages/AnomalyDetectionPage';
import { AssistantChatPage } from './pages/AssistantChatPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { SystemHealthPage } from './pages/SystemHealthPage';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [isLiveApi, setIsLiveApiState] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('viewer');

  const handleToggleLiveApi = (live: boolean) => {
    setIsLiveApiState(live);
    setLiveMode(live);
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'overview':
        return <ExecutiveOverview onNavigate={setCurrentPage} />;
      case 'traffic':
        return <TrafficIntelligence />;
      case 'environment':
        return <EnvironmentalIntelligence />;
      case 'safety':
        return <SafetyAndRisk />;
      case 'geospatial':
        return <GeospatialExplorer />;
      case 'forecasting':
        return <ForecastingPage />;
      case 'anomalies':
        return <AnomalyDetectionPage />;
      case 'assistant':
        return <AssistantChatPage />;
      case 'models':
        return <ModelPerformancePage />;
      case 'health':
        return <SystemHealthPage />;
      default:
        return <ExecutiveOverview onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Bar */}
        <Header
          currentPage={currentPage}
          isLiveApi={isLiveApi}
          onToggleLiveApi={handleToggleLiveApi}
          userRole={userRole}
          onRoleChange={setUserRole}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </div>
  );
};
export default App;
