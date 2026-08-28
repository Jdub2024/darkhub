import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const initialNodes = [
  { id: 'node_1', position: { x: 10, y: 20 }, type: 'traffic', label: 'Node 1', metrics: {} },
  { id: 'node_2', position: { x: 50, y: 50 }, type: 'checkout', label: 'Node 2', metrics: {} },
];

let lastContextValue = null;

const TestComponent = () => {
  const context = useFunnel();
  lastContextValue = context;
  return (
    <div>
      <button
        data-testid="move-node-1"
        onClick={() => context.updateNodePosition('node_1', 100, 200)}
      >
        Move Node 1
      </button>
      <button
        data-testid="move-node-1-same"
        onClick={() => context.updateNodePosition('node_1', 10, 20)}
      >
        Move Node 1 Same
      </button>
      <button
        data-testid="move-non-existent"
        onClick={() => context.updateNodePosition('node_99', 100, 200)}
      >
        Move Non Existent
      </button>
    </div>
  );
};

describe('FunnelProvider performance optimizations', () => {
  beforeEach(() => {
    lastContextValue = null;
  });

  test('updates node position when coordinates change', () => {
    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent />
      </FunnelProvider>
    );

    act(() => {
      fireEvent.click(getByTestId('move-node-1'));
    });

    expect(lastContextValue.nodes[0].position).toEqual({ x: 100, y: 200 });
  });

  test('bails out and preserves nodes state reference when coordinates are identical', () => {
    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent />
      </FunnelProvider>
    );

    const initialNodesRef = lastContextValue.nodes;

    act(() => {
      fireEvent.click(getByTestId('move-node-1-same'));
    });

    expect(lastContextValue.nodes).toBe(initialNodesRef);
  });

  test('bails out and preserves nodes state reference when node id does not exist', () => {
    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent />
      </FunnelProvider>
    );

    const initialNodesRef = lastContextValue.nodes;

    act(() => {
      fireEvent.click(getByTestId('move-non-existent'));
    });

    expect(lastContextValue.nodes).toBe(initialNodesRef);
  });
});
