import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../components/common/StatCard';
import { Activity } from 'lucide-react';

describe('StatCard Component', () => {
  it('renders title, value, and unit correctly', () => {
    render(
      <StatCard
        title="Mobility Index"
        value={82}
        unit="/100"
        icon={<Activity />}
        subtitle="Metropolitan composite speed score"
      />
    );

    expect(screen.getByText('Mobility Index')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
    expect(screen.getByText('Metropolitan composite speed score')).toBeInTheDocument();
  });

  it('renders status badge properly', () => {
    render(
      <StatCard
        title="Active Hotspots"
        value={5}
        icon={<Activity />}
        badge={{ text: 'CRITICAL', variant: 'rose' }}
      />
    );

    expect(screen.getByText('Active Hotspots')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('renders uncertainty interval when provided', () => {
    render(
      <StatCard
        title="Predicted Flow"
        value="1,450"
        uncertaintyInterval="[1,320 – 1,580]"
      />
    );

    expect(screen.getByText(/90% CI: \[1,320 – 1,580\]/)).toBeInTheDocument();
  });
});
