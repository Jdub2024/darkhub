import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const initialNodes = [
  { id: 'node_1', position: { x: 100, y: 200 } },
  { id: 'node_2', position: { x: 300, y: 400 } },
];

test('bails out of state update when position is unchanged or node is missing', () => {
  let contextRef;

  function TestComponent() {
    contextRef = useFunnel();
    return null;
  }

  render(
    <FunnelProvider initialNodes={initialNodes}>
      <TestComponent />
    </FunnelProvider>
  );

  const initialNodesState = contextRef.nodes;

  // Call updateNodePosition with the exact same coordinates
  act(() => {
    contextRef.updateNodePosition('node_1', 100, 200);
  });

  // Check state reference is identical (bailout occurred)
  expect(contextRef.nodes).toBe(initialNodesState);

  // Call updateNodePosition with a non-existent node ID
  act(() => {
    contextRef.updateNodePosition('non_existent', 500, 500);
  });

  // Check state reference is still identical
  expect(contextRef.nodes).toBe(initialNodesState);

  // Call updateNodePosition with NEW coordinates
  act(() => {
    contextRef.updateNodePosition('node_1', 150, 250);
  });

  // Check state reference updated
  expect(contextRef.nodes).not.toBe(initialNodesState);
  expect(contextRef.nodes[0].position).toEqual({ x: 150, y: 250 });
});
