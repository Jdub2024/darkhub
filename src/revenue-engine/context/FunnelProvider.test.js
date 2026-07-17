import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

jest.useFakeTimers();

const TestComponent = ({ onStateChange, autoSync }) => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
      <span data-testid="nodes-count">{nodes.length}</span>
      <button
        data-testid="move-node"
        onClick={() => updateNodePosition('node-1', 100, 200)}
      >
        Move Node
      </button>
      <button
        data-testid="move-node-same"
        onClick={() => updateNodePosition('node-1', 0, 0)}
      >
        Move Node Same
      </button>
    </div>
  );
};

describe('FunnelProvider', () => {
  let initialNodes;
  let initialEdges;

  beforeEach(() => {
    initialNodes = [
      { id: 'node-1', position: { x: 0, y: 0 } },
    ];
    initialEdges = [];
    jest.clearAllMocks();
  });

  test('batches onStateChange callbacks and debounces them', () => {
    const handleStateChange = jest.fn();

    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial sync call scheduled during mount
    expect(handleStateChange).not.toHaveBeenCalled();

    // Trigger high-frequency position updates
    const button = getByTestId('move-node');
    act(() => {
      button.click();
    });

    // Fast-forward slightly - still shouldn't trigger
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward past 150ms debounce window
    act(() => {
      jest.advanceTimersByTime(51);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenLastCalledWith({
      nodes: [{ id: 'node-1', position: { x: 100, y: 200 } }],
      edges: [],
    });
  });

  test('bails out of state updates when coordinates are unchanged', () => {
    const handleStateChange = jest.fn();

    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Click to move to the same coordinates (0, 0)
    const sameButton = getByTestId('move-node-same');
    act(() => {
      sameButton.click();
    });

    // Run timers
    act(() => {
      jest.runAllTimers();
    });

    // The mount trigger should be the only state sync that ran, but since setting state to the same coordinates bails out,
    // the callback is only called once. Let's make sure it handles it without extra triggers.
    expect(handleStateChange).toHaveBeenCalledTimes(1);
  });
});
