import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const mockNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Test Node 1',
    position: { x: 100, y: 100 },
    metrics: { views: '1000' },
  },
  {
    id: 'node_2',
    type: 'checkout',
    label: 'Test Node 2',
    position: { x: 400, y: 100 },
    metrics: { sales: '50' },
  },
];

const mockEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

describe('FunnelArchitect', () => {
  test('renders nodes and edges from FunnelProvider context correctly', () => {
    render(
      <FunnelProvider initialNodes={mockNodes} initialEdges={mockEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Test Node 1')).toBeInTheDocument();
    expect(screen.getByText('Test Node 2')).toBeInTheDocument();
  });
});
