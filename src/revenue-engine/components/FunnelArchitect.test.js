import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const initialNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Node 1',
    position: { x: 0, y: 0 },
    metrics: { volume: '100' },
  },
  {
    id: 'node_2',
    type: 'landing_page',
    label: 'Node 2',
    position: { x: 300, y: 0 },
    metrics: { views: '50' },
  },
];

const initialEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

test('renders FunnelArchitect and edge path', () => {
  render(
    <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
      <FunnelArchitect />
    </FunnelProvider>
  );

  expect(screen.getByText('Node 1')).toBeInTheDocument();
  expect(screen.getByText('Node 2')).toBeInTheDocument();
});
