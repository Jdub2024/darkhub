import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const testNodes = [
  {
    id: 'n1',
    type: 'traffic',
    label: 'Meta Ad Campaign',
    position: { x: 100, y: 100 },
    metrics: { clicks: '1,200' },
  },
  {
    id: 'n2',
    type: 'checkout',
    label: 'Checkout Page',
    position: { x: 500, y: 200 },
    metrics: { orders: '150' },
  },
];

const testEdges = [
  { id: 'e1', source: 'n1', target: 'n2', isActive: true },
];

describe('FunnelArchitect Component', () => {
  test('renders nodes and SVG edges with primitive coordinate props', () => {
    const { container } = render(
      <FunnelProvider initialNodes={testNodes} initialEdges={testEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Meta Ad Campaign')).toBeInTheDocument();
    expect(screen.getByText('Checkout Page')).toBeInTheDocument();

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const paths = container.querySelectorAll('svg path');
    expect(paths.length).toBeGreaterThan(0);
  });
});
