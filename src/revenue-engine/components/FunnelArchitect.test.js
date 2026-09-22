import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider } from '../context/FunnelProvider';
import FunnelArchitect from './FunnelArchitect';

const testNodes = [
  {
    id: 'node_1',
    type: 'traffic',
    label: 'Test Node 1',
    position: { x: 0, y: 0 },
    metrics: { click: '10' },
  },
  {
    id: 'node_2',
    type: 'checkout',
    label: 'Test Node 2',
    position: { x: 300, y: 100 },
    metrics: { buy: '5' },
  },
];

const testEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
];

describe('FunnelArchitect', () => {
  test('renders nodes and edges correctly', () => {
    render(
      <FunnelProvider initialNodes={testNodes} initialEdges={testEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Test Node 1')).toBeInTheDocument();
    expect(screen.getByText('Test Node 2')).toBeInTheDocument();
  });
});
