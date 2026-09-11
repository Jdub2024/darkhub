import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider } from '../context/FunnelProvider';
import FunnelArchitect from './FunnelArchitect';

const initialNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Traffic Node',
    position: { x: 100, y: 100 },
    metrics: { views: '1000' },
  },
  {
    id: 'node_2',
    type: 'landing_page',
    label: 'Landing Node',
    position: { x: 500, y: 100 },
    metrics: { conversion: '10%' },
  },
];

const initialEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

describe('FunnelArchitect', () => {
  test('renders nodes and SVG edge connections with primitive coordinates', () => {
    const { container } = render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Traffic Node')).toBeInTheDocument();
    expect(screen.getByText('Landing Node')).toBeInTheDocument();

    const paths = container.querySelectorAll('svg path');
    expect(paths.length).toBeGreaterThan(0);

    // Verify SVG path coordinates calculated correctly with node dimensions (NODE_WIDTH = 256, NODE_HEIGHT = 114)
    // sourceX = 100 + 256 = 356, sourceY = 100 + 57 = 157
    // targetX = 500, targetY = 100 + 57 = 157
    const mainPath = paths[paths.length - 1];
    expect(mainPath.getAttribute('d')).toContain('M 356 157');
    expect(mainPath.getAttribute('d')).toContain('500 157');
  });
});
