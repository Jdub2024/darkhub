import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const mockNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Traffic Source',
    position: { x: 100, y: 100 },
    metrics: { val: '100' },
  },
  {
    id: 'node_2',
    type: 'checkout',
    label: 'Checkout Page',
    position: { x: 500, y: 100 },
    metrics: { val: '50' },
  },
];

const mockEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

describe('FunnelArchitect', () => {
  test('renders nodes and edge path elements correctly', () => {
    const { container } = render(
      <FunnelProvider initialNodes={mockNodes} initialEdges={mockEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Traffic Source')).toBeInTheDocument();
    expect(screen.getByText('Checkout Page')).toBeInTheDocument();

    const pathElements = container.querySelectorAll('svg path');
    expect(pathElements.length).toBeGreaterThan(0);
  });
});
