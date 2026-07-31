import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Test component to interact with FunnelProvider context hooks
const TestComponent = ({ onNodePositionChange }) => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
      <div data-testid="node-position">
        {nodes[0] ? `${nodes[0].position.x},${nodes[0].position.y}` : ''}
      </div>
      <button
        data-testid="drag-node-btn"
        onClick={() => {
          updateNodePosition('node_1', 100, 200);
          if (onNodePositionChange) onNodePositionChange();
        }}
      >
        Drag Node
      </button>
      <button
        data-testid="drag-node-same-btn"
        onClick={() => {
          updateNodePosition('node_1', 100, 200);
          if (onNodePositionChange) onNodePositionChange();
        }}
      >
        Drag Same Position
      </button>
    </div>
  );
};

describe('FunnelProvider Performance Optimization Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces state synchronization (onStateChange)', () => {
    const onStateChangeMock = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 10, y: 10 } },
    ];

    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChangeMock}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    const dragBtn = getByTestId('drag-node-btn');

    // Fast-drag simulations
    act(() => {
      dragBtn.click();
    });
    act(() => {
      dragBtn.click();
    });
    act(() => {
      dragBtn.click();
    });

    // Verify callback hasn't been called immediately due to debouncing
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Fast-forward by 100ms (debounce threshold is 150ms)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Fast-forward to 150ms to trigger the synchronized update
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);
    expect(onStateChangeMock).toHaveBeenCalledWith({
      nodes: [{ id: 'node_1', position: { x: 100, y: 200 } }],
      edges: [],
    });
  });

  test('bails out of state updates when positions are identical (equality guard)', () => {
    let renderCount = 0;
    const initialNodes = [
      { id: 'node_1', position: { x: 100, y: 200 } },
    ];

    const RenderTracker = () => {
      renderCount++;
      return null;
    };

    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <RenderTracker />
        <TestComponent />
      </FunnelProvider>
    );

    // Reset counter to track only update renders
    renderCount = 0;

    const dragSameBtn = getByTestId('drag-node-same-btn');

    // Trigger update with identical position coordinates
    act(() => {
      dragSameBtn.click();
    });

    // Due to the equality guard / state update bail-out, no re-render should happen
    expect(renderCount).toBe(0);
  });
});
