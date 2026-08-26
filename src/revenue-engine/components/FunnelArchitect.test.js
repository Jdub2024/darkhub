import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const mockNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Meta Ad Campaign',
    position: { x: 100, y: 100 },
    metrics: { clicks: '10k' },
  },
  {
    id: 'node_2',
    type: 'checkout',
    label: 'Main Store Checkout',
    position: { x: 500, y: 100 },
    metrics: { sales: '500' },
  },
];

const mockEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

test('renders FunnelArchitect nodes correctly', () => {
  render(
    <FunnelProvider initialNodes={mockNodes} initialEdges={mockEdges}>
      <FunnelArchitect />
    </FunnelProvider>
  );

  expect(screen.getByText('Meta Ad Campaign')).toBeInTheDocument();
  expect(screen.getByText('Main Store Checkout')).toBeInTheDocument();
});
