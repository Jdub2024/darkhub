import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const mockNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Node 1',
    position: { x: 0, y: 0 },
    metrics: { count: '100' },
  },
  {
    id: 'node_2',
    type: 'checkout',
    label: 'Node 2',
    position: { x: 300, y: 100 },
    metrics: { count: '50' },
  },
];

const mockEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

test('renders nodes and svg edges correctly', () => {
  render(
    <FunnelProvider initialNodes={mockNodes} initialEdges={mockEdges}>
      <FunnelArchitect />
    </FunnelProvider>
  );

  expect(screen.getByText('Node 1')).toBeInTheDocument();
  expect(screen.getByText('Node 2')).toBeInTheDocument();

  // Verify SVG container and paths exist
  const svgElement = document.querySelector('svg');
  expect(svgElement).toBeInTheDocument();
  const paths = svgElement.querySelectorAll('path');
  expect(paths.length).toBeGreaterThan(0);
});
