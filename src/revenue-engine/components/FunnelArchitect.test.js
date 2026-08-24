import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

describe('FunnelArchitect', () => {
  const mockNodes = [
    {
      id: 'node_1',
      type: 'traffic',
      label: 'Traffic Source',
      position: { x: 10, y: 20 },
      metrics: { volume: '10k' },
    },
    {
      id: 'node_2',
      type: 'checkout',
      label: 'Checkout Page',
      position: { x: 300, y: 20 },
      metrics: { sales: '500' },
    },
  ];

  const mockEdges = [
    { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
  ];

  test('renders nodes and edge elements correctly', () => {
    render(
      <FunnelProvider initialNodes={mockNodes} initialEdges={mockEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Traffic Source')).toBeInTheDocument();
    expect(screen.getByText('Checkout Page')).toBeInTheDocument();
  });
});
