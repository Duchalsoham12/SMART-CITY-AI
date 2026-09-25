import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EpistemicNotice } from '../components/common/EpistemicNotice';

describe('EpistemicNotice Component', () => {
  it('renders default non-causal warning text', () => {
    render(<EpistemicNotice />);
    expect(screen.getByText(/Non-Causal Epistemic Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/MODEL_PREDICTION/i)).toBeInTheDocument();
  });

  it('renders custom text and source citation badge', () => {
    render(
      <EpistemicNotice
        temporalClassification="HISTORICAL_OBSERVATION"
        customText="Historical sensor observations from Pune CPCB continuous monitoring network."
        sourceCitation="[Source: cpcb.gov.in/telemetry]"
      />
    );

    expect(screen.getByText(/Historical sensor observations/i)).toBeInTheDocument();
    expect(screen.getByText('[HISTORICAL_OBSERVATION]')).toBeInTheDocument();
    expect(screen.getByText('[Source: cpcb.gov.in/telemetry]')).toBeInTheDocument();
  });
});
