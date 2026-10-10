import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const mockNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Meta Ads',
    position: { x: 50, y: 100 },
    metrics: { clickRate: '2.5%' },
  },
  {
    id: 'node_2',
    type: 'checkout',
    label: 'Checkout Page',
    position: { x: 400, y: 100 },
    metrics: { conversion: '10%' },
  },
];

const mockEdges = [
  {
    id: 'edge_1_2',
    source: 'node_1',
    target: 'node_2',
    isActive: true,
  },
];

describe('FunnelArchitect', () => {
  it('renders nodes and edge SVG correctly with calculated primitive coordinates', () => {
    const { container } = render(
      <FunnelProvider initialNodes={mockNodes} initialEdges={mockEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Meta Ads')).toBeInTheDocument();
    expect(screen.getByText('Checkout Page')).toBeInTheDocument();

    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();

    // Check SVG paths rendered for edge_1_2
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);

    // Node 1 sourceX = 50 + 256 = 306, sourceY = 100 + 57 = 157
    // Node 2 targetX = 400, targetY = 100 + 57 = 157
    const mainPath = paths[paths.length - 1];
    expect(mainPath.getAttribute('d')).toContain('M 306 157');
    expect(mainPath.getAttribute('d')).toContain('400 157');
  });
});
