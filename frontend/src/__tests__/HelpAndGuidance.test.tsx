import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '../components/help/Tooltip';
import { InfoPopover } from '../components/help/InfoPopover';
import { OnboardingModal } from '../components/help/OnboardingModal';
import { ProductTour } from '../components/help/ProductTour';
import { HelpCenterModal } from '../components/help/HelpCenterModal';
import { DocumentationCenterPage } from '../pages/DocumentationCenterPage';
import { ErrorGuidance } from '../components/common/ErrorGuidance';
import { EmptyState } from '../components/common/EmptyState';

describe('User Guidance & Help Components', () => {
  it('renders Tooltip on mouse hover', () => {
    render(
      <Tooltip content="Test Tooltip Text">
        <button>Hover Me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover Me')).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByText('Hover Me'));
    expect(screen.getByText('Test Tooltip Text')).toBeInTheDocument();
  });

  it('renders InfoPopover and toggles content on click', () => {
    render(
      <InfoPopover
        termKey="prediction_interval"
      />
    );

    const infoBtn = screen.getByRole('button', { name: /learn more about 90% prediction interval/i });
    expect(infoBtn).toBeInTheDocument();

    // Click to open
    fireEvent.click(infoBtn);
    expect(screen.getByText('90% Prediction Interval')).toBeInTheDocument();
    expect(screen.getByText(/Calibrated bounds/i)).toBeInTheDocument();

    // Close button inside popover
    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Calibrated bounds/i)).not.toBeInTheDocument();
  });

  it('renders OnboardingModal and handles start tour action', () => {
    const handleStartTour = vi.fn();
    const handleClose = vi.fn();
    const handleOpenGuide = vi.fn();

    render(
      <OnboardingModal
        isOpen={true}
        onClose={handleClose}
        onStartTour={handleStartTour}
        onOpenGuide={handleOpenGuide}
      />
    );

    expect(screen.getByText(/Welcome to SmartCityAI/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyze → Predict → Understand → Recommend → Act/i)).toBeInTheDocument();

    const tourBtn = screen.getByRole('button', { name: /take a quick tour/i });
    fireEvent.click(tourBtn);
    expect(handleStartTour).toHaveBeenCalled();
  });

  it('renders ProductTour and advances steps', () => {
    const handleClose = vi.fn();
    const handleNavigate = vi.fn();

    render(
      <ProductTour
        isOpen={true}
        onClose={handleClose}
        onNavigatePage={handleNavigate}
      />
    );

    expect(screen.getByText(/Step 1 of/i)).toBeInTheDocument();
    expect(screen.getByText('Executive Command Center')).toBeInTheDocument();

    // Click Next Step
    const nextBtn = screen.getByRole('button', { name: /next step/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Step 2 of/i)).toBeInTheDocument();
    expect(screen.getByText('Urban Intelligence Map')).toBeInTheDocument();
    expect(handleNavigate).toHaveBeenCalledWith('geospatial');
  });

  it('renders HelpCenterModal and filters articles via search query', () => {
    render(
      <HelpCenterModal
        isOpen={true}
        onClose={vi.fn()}
        onStartTour={vi.fn()}
      />
    );

    expect(screen.getByText(/SmartCityAI Knowledge Base & Help Center/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search help topics/i);
    fireEvent.change(searchInput, { target: { value: 'DBSCAN' } });

    // Should match Urban Intelligence Map Guide in list and detail pane
    expect(screen.getAllByText('Urban Intelligence Map Guide').length).toBeGreaterThan(0);
  });

  it('renders DocumentationCenterPage and switches roles', () => {
    render(<DocumentationCenterPage />);

    expect(screen.getByText(/SmartCityAI Urban Intelligence Platform Guide/i)).toBeInTheDocument();

    // Switch role to City Administrator
    const adminTab = screen.getByRole('button', { name: /city administrator/i });
    fireEvent.click(adminTab);

    expect(screen.getByText(/City Administrator & Executive Leadership/i)).toBeInTheDocument();
  });

  it('renders ErrorGuidance with technical details and retry button', () => {
    const handleRetry = vi.fn();
    render(
      <ErrorGuidance
        title="Failed to Load Stream"
        message="Gateway timeout from upstream sensor ingest."
        errorCode={504}
        technicalDetails="HTTP 504 Gateway Timeout: /api/v1/traffic/speed"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText('Failed to Load Stream')).toBeInTheDocument();
    expect(screen.getByText('CODE 504')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry request/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalled();
  });

  it('renders EmptyState with actions and custom icon', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Incidents Reported"
        message="Zero crash records detected in this corridor for the past 24 hours."
        icon="🛡️"
        actionLabel="Refresh Telemetry"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('No Incidents Reported')).toBeInTheDocument();
    expect(screen.getByText('🛡️')).toBeInTheDocument();

    const actionBtn = screen.getByRole('button', { name: /refresh telemetry/i });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalled();
  });
});
