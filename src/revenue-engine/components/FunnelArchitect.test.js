import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect from './FunnelArchitect';
import { FunnelProvider } from '../context/FunnelProvider';

const testNodes = [
  {
    id: 'n1',
    type: 'traffic',
    label: 'Test Node 1',
    position: { x: 0, y: 0 },
    metrics: { v: '100' },
  },
  {
    id: 'n2',
    type: 'landing_page',
    label: 'Test Node 2',
    position: { x: 300, y: 100 },
    metrics: { v: '50' },
  },
];

const testEdges = [
  { id: 'e1', source: 'n1', target: 'n2', isActive: true },
];

test('renders nodes and edges in FunnelArchitect', () => {
  render(
    <FunnelProvider initialNodes={testNodes} initialEdges={testEdges}>
      <FunnelArchitect />
    </FunnelProvider>
  );

  expect(screen.getByText('Test Node 1')).toBeInTheDocument();
  expect(screen.getByText('Test Node 2')).toBeInTheDocument();
});
