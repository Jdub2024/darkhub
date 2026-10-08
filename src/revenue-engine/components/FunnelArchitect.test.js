import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const testNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Meta Ads',
    position: { x: 100, y: 100 },
    metrics: { volume: '10k' },
  },
  {
    id: 'node_2',
    type: 'checkout',
    label: 'Checkout Page',
    position: { x: 400, y: 100 },
    metrics: { sales: '500' },
  },
];

const testEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

describe('FunnelArchitect', () => {
  test('renders nodes and edge SVG elements correctly', () => {
    const { container } = render(
      <FunnelProvider initialNodes={testNodes} initialEdges={testEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Meta Ads')).toBeInTheDocument();
    expect(screen.getByText('Checkout Page')).toBeInTheDocument();

    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });
});
