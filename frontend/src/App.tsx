import React, { useState, useEffect } from 'react';
import { PageId, Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { setLiveMode } from './services/apiClient';

// Pages
import { ExecutiveOverview } from './pages/ExecutiveOverview';
import { DatasetManagementPage } from './pages/DatasetManagementPage';
import { TrafficIntelligence } from './pages/TrafficIntelligence';
import { EnvironmentalIntelligence } from './pages/EnvironmentalIntelligence';
import { SafetyAndRisk } from './pages/SafetyAndRisk';
import { GeospatialExplorer } from './pages/GeospatialExplorer';
import { ForecastingPage } from './pages/ForecastingPage';
import { AnomalyDetectionPage } from './pages/AnomalyDetectionPage';
import { AssistantChatPage } from './pages/AssistantChatPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { DocumentationCenterPage } from './pages/DocumentationCenterPage';

// Help, Onboarding & Tour Components
import { OnboardingModal } from './components/help/OnboardingModal';
import { ProductTour } from './components/help/ProductTour';
import { HelpCenterModal } from './components/help/HelpCenterModal';
import { DatasetUploadModal } from './components/datasets/DatasetUploadModal';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [isLiveApi, setIsLiveApiState] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('viewer');

  // Help, Onboarding & Upload Modals State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem('smartcityai_onboarding_shown') === null;
  });
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const handleToggleLiveApi = (live: boolean) => {
    setIsLiveApiState(live);
    setLiveMode(live);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Escape key closes modals
      if (e.key === 'Escape') {
        if (isTourOpen) setIsTourOpen(false);
        if (isHelpModalOpen) setIsHelpModalOpen(false);
        if (isOnboardingOpen) setIsOnboardingOpen(false);
        if (isUploadModalOpen) setIsUploadModalOpen(false);
        return;
      }

      // '?' or 'Shift+/' toggles Help Center
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsHelpModalOpen((prev) => !prev);
        return;
      }

      // Only evaluate single-letter navigation hotkeys if not inside text input
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'd') {
          setCurrentPage('overview');
        } else if (key === 'u') {
          setCurrentPage('datasets');
        } else if (key === 'm') {
          setCurrentPage('geospatial');
        } else if (key === 't') {
          setCurrentPage('traffic');
        } else if (key === 's') {
          setCurrentPage('safety');
        } else if (key === 'a') {
          setCurrentPage('assistant');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourOpen, isHelpModalOpen, isOnboardingOpen, isUploadModalOpen]);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'overview':
        return <ExecutiveOverview onNavigate={setCurrentPage} />;
      case 'datasets':
        return <DatasetManagementPage onOpenUpload={() => setIsUploadModalOpen(true)} />;
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
      case 'docs':
        return (
          <DocumentationCenterPage
            onStartTour={() => setIsTourOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onNavigate={setCurrentPage}
          />
        );
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
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onOpenTour={() => setIsTourOpen(true)}
          onOpenUpload={() => setIsUploadModalOpen(true)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>

        {/* Global Footer */}
        <Footer />
      </div>

      {/* First-Time User Onboarding Hero Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onStartTour={() => {
          setIsOnboardingOpen(false);
          setIsTourOpen(true);
        }}
        onOpenGuide={() => {
          setIsOnboardingOpen(false);
          setCurrentPage('docs');
        }}
      />

      {/* Interactive Step-by-Step Guided Product Tour */}
      <ProductTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigatePage={(pageId) => setCurrentPage(pageId as PageId)}
      />

      {/* Permanent Searchable Help Center & Knowledge Base Modal */}
      <HelpCenterModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onStartTour={() => {
          setIsHelpModalOpen(false);
          setIsTourOpen(true);
        }}
        onOpenFullDocs={() => {
          setIsHelpModalOpen(false);
          setCurrentPage('docs');
        }}
      />

      {/* Dataset Ingestion & Upload Modal */}
      <DatasetUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          setCurrentPage('datasets');
        }}
      />
    </div>
  );
};

export default App;
