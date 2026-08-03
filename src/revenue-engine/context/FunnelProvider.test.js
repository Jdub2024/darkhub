import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Test component to interact with FunnelProvider hook context safely.
const TestComponent = ({ onStateChange, autoSync, onAction }) => {
  const { nodes, updateNodePosition } = useFunnel();

  React.useEffect(() => {
    if (onAction) {
      onAction({ nodes, updateNodePosition });
    }
  }, [nodes, updateNodePosition, onAction]);

  return <div data-testid="nodes-count">{nodes.length}</div>;
};

describe('FunnelProvider Performance Optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('updateNodePosition bails out when position coordinates are identical', () => {
    const initialNodes = [
      { id: 'node_1', position: { x: 10, y: 20 }, metrics: {} },
    ];
    let capturedNodes1 = null;
    let capturedNodes2 = null;
    let updateFn = null;

    const { rerender } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent
          onAction={({ nodes, updateNodePosition }) => {
            capturedNodes1 = nodes;
            updateFn = updateNodePosition;
          }}
        />
      </FunnelProvider>
    );

    // Call update with the exact same coordinates
    act(() => {
      updateFn('node_1', 10, 20);
    });

    rerender(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent
          onAction={({ nodes }) => {
            capturedNodes2 = nodes;
          }}
        />
      </FunnelProvider>
    );

    // Reference equality check to ensure React bailed out and did not re-allocate the nodes array.
    expect(capturedNodes1).toBe(capturedNodes2);
  });

  test('onStateChange debounces updates under high frequency updates', () => {
    const initialNodes = [
      { id: 'node_1', position: { x: 10, y: 20 }, metrics: {} },
    ];
    const onStateChangeMock = jest.fn();
    let updateFn = null;

    render(
      <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChangeMock} autoSync={true}>
        <TestComponent
          onAction={({ updateNodePosition }) => {
            updateFn = updateNodePosition;
          }}
        />
      </FunnelProvider>
    );

    // Perform multiple state updates sequentially (simulating a high-frequency drag event)
    act(() => {
      updateFn('node_1', 11, 20);
    });
    act(() => {
      updateFn('node_1', 12, 20);
    });
    act(() => {
      updateFn('node_1', 13, 20);
    });

    // At this moment, mock should not have been called because of debounce timeout (150ms)
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Fast-forward timers by 150ms
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // The synchronization must only be called once with the batched/final state
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);
    expect(onStateChangeMock.mock.calls[0][0].nodes[0].position).toEqual({ x: 13, y: 20 });
  });
});
