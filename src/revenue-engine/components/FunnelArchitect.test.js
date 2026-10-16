import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider } from '../context/FunnelProvider';
import FunnelArchitect from './FunnelArchitect';

const testNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Source Node',
    position: { x: 100, y: 100 },
    metrics: { clicks: '100' },
  },
  {
    id: 'node_2',
    type: 'checkout',
    label: 'Target Node',
    position: { x: 500, y: 200 },
    metrics: { sales: '10' },
  },
];

const testEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

describe('FunnelArchitect component', () => {
  test('renders nodes and edge svg paths correctly with primitive coordinate calculation', () => {
    const { container } = render(
      <FunnelProvider initialNodes={testNodes} initialEdges={testEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Source Node')).toBeInTheDocument();
    expect(screen.getByText('Target Node')).toBeInTheDocument();

    const svgPaths = container.querySelectorAll('svg path');
    expect(svgPaths.length).toBeGreaterThan(0);

    // Node 1 position: x=100, NODE_WIDTH=256 => sourceX = 356
    // Node 1 position: y=100, NODE_HEIGHT/2=57 => sourceY = 157
    // Node 2 position: x=500, y=200 => targetX = 500, targetY = 257
    const expectedPathStart = 'M 356 157';
    const hasPathData = Array.from(svgPaths).some((p) =>
      p.getAttribute('d')?.startsWith(expectedPathStart)
    );

    expect(hasPathData).toBe(true);
  });
});
