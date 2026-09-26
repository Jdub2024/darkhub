import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import App from './App';
import { FunnelProvider, useFunnel } from './revenue-engine/context/FunnelProvider';

test('renders funnel architect', () => {
  render(<App />);
  const linkElement = screen.getByText(/Paid Meta Framework/i);
  expect(linkElement).toBeInTheDocument();
});

test('updateNodePosition maintains state reference equality when coordinates are unchanged or node missing', () => {
  let contextValue;
  const TestComponent = () => {
    contextValue = useFunnel();
    return null;
  };

  const initialNodes = [
    { id: 'node_1', position: { x: 10, y: 20 } },
  ];

  render(
    <FunnelProvider initialNodes={initialNodes}>
      <TestComponent />
    </FunnelProvider>
  );

  const initialNodesState = contextValue.nodes;

  // Updating with unchanged position should retain same array reference
  act(() => {
    contextValue.updateNodePosition('node_1', 10, 20);
  });
  expect(contextValue.nodes).toBe(initialNodesState);

  // Updating with non-existent node ID should retain same array reference
  act(() => {
    contextValue.updateNodePosition('non_existent', 50, 50);
  });
  expect(contextValue.nodes).toBe(initialNodesState);

  // Updating with new position should produce a new state array reference
  act(() => {
    contextValue.updateNodePosition('node_1', 100, 200);
  });
  expect(contextValue.nodes).not.toBe(initialNodesState);
  expect(contextValue.nodes[0].position).toEqual({ x: 100, y: 200 });
});
