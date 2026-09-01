import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const testNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Source Alpha',
    position: { x: 100, y: 100 },
    metrics: { click: '100' },
  },
  {
    id: 'node_2',
    type: 'checkout',
    label: 'Target Beta',
    position: { x: 500, y: 100 },
    metrics: { conv: '10%' },
  },
];

const testEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

describe('FunnelArchitect Component', () => {
  test('renders nodes and SVG edge accurately', () => {
    const { container } = render(
      <FunnelProvider initialNodes={testNodes} initialEdges={testEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Source Alpha')).toBeInTheDocument();
    expect(screen.getByText('Target Beta')).toBeInTheDocument();

    const svgPaths = container.querySelectorAll('svg path');
    expect(svgPaths.length).toBeGreaterThan(0);
  });
});
