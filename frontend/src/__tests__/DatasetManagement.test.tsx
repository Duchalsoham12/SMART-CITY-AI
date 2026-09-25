import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DatasetManagementPage } from '../pages/DatasetManagementPage';
import { DatasetUploadModal } from '../components/datasets/DatasetUploadModal';
import { setLiveMode } from '../services/apiClient';

describe('Dataset Ingestion & Management Module', () => {
  beforeEach(() => {
    setLiveMode(false);
  });
  it('renders DatasetManagementPage with KPIs and catalog table', async () => {
    render(<DatasetManagementPage />);

    expect(screen.getByText('Dataset Management & Preflight Ingestion')).toBeInTheDocument();
    expect(screen.getByText('Registered Catalogs')).toBeInTheDocument();
    expect(screen.getByText('Verified Records')).toBeInTheDocument();
    expect(screen.getByText('Avg Quality Score')).toBeInTheDocument();
    expect(screen.getByText('Quarantined Policy')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('chicago_traffic_loop_telemetry')).toBeInTheDocument();
    });
  });

  it('renders DatasetUploadModal with dropzone and sample loader', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <DatasetUploadModal
        isOpen={true}
        onClose={handleClose}
        onUploadSuccess={handleSuccess}
      />
    );

    expect(screen.getByText('Dataset Ingestion & Preflight Validation')).toBeInTheDocument();
    expect(screen.getByText(/Drop your CSV, Excel, or JSON file here/i)).toBeInTheDocument();
    expect(screen.getByText('Load Sample Stream')).toBeInTheDocument();
    expect(screen.getByText('Traffic Flow')).toBeInTheDocument();
    expect(screen.getByText('Air Quality')).toBeInTheDocument();
  });

  it('loads sample dataset stream into mapping step', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <DatasetUploadModal
        isOpen={true}
        onClose={handleClose}
        onUploadSuccess={handleSuccess}
      />
    );

    const loadSampleBtn = screen.getByText('Load Sample Stream');
    fireEvent.click(loadSampleBtn);

    await waitFor(() => {
      expect(screen.getByText('Smart Column Mapping')).toBeInTheDocument();
      expect(screen.getByText('Run Preflight Validation Gate')).toBeInTheDocument();
    });
  });
});
