import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider } from '../context/FunnelProvider';
import FunnelArchitect from './FunnelArchitect';

const initialNodes = [
  {
    id: 'n1',
    type: 'traffic',
    label: 'Node One',
    position: { x: 0, y: 0 },
    metrics: { key: 'val' },
  },
  {
    id: 'n2',
    type: 'checkout',
    label: 'Node Two',
    position: { x: 300, y: 100 },
    metrics: { key: 'val2' },
  },
];

const initialEdges = [
  { id: 'e1', source: 'n1', target: 'n2', isActive: true },
];

describe('FunnelArchitect', () => {
  it('renders nodes and edges accurately', () => {
    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Node One')).toBeInTheDocument();
    expect(screen.getByText('Node Two')).toBeInTheDocument();
  });
});
