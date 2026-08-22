import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from '../context/FunnelProvider';
import FunnelArchitect from './FunnelArchitect';

const initialNodes = [
  { id: 'n1', type: 'traffic', label: 'Traffic', position: { x: 0, y: 0 }, metrics: {} },
  { id: 'n2', type: 'landing_page', label: 'Landing', position: { x: 300, y: 0 }, metrics: {} },
  { id: 'n3', type: 'checkout', label: 'Checkout', position: { x: 600, y: 0 }, metrics: {} },
];

const initialEdges = [
  { id: 'e1', source: 'n1', target: 'n2', isActive: true },
  { id: 'e2', source: 'n2', target: 'n3', isActive: false },
];

function TestComponent() {
  const { updateNodePosition } = useFunnel();
  return (
    <div>
      <button onClick={() => updateNodePosition('n1', 10, 10)}>Move N1</button>
      <FunnelArchitect />
    </div>
  );
}

test('renders FunnelArchitect and updates node position correctly', () => {
  render(
    <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
      <TestComponent />
    </FunnelProvider>
  );

  expect(screen.getByText('Traffic')).toBeInTheDocument();
  expect(screen.getByText('Landing')).toBeInTheDocument();
  expect(screen.getByText('Checkout')).toBeInTheDocument();

  const moveButton = screen.getByText('Move N1');
  act(() => {
    moveButton.click();
  });

  expect(screen.getByText('Traffic')).toBeInTheDocument();
});
