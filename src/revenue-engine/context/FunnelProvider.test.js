import React, { act, useEffect } from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Custom test component to consume and test the useFunnel context hook safely.
const FunnelConsumerTest = ({ testAction }) => {
  const { nodes, updateNodePosition } = useFunnel();

  useEffect(() => {
    testAction(updateNodePosition);
  }, [updateNodePosition, testAction]);

  return (
    <div>
      <span data-testid="node-x">{nodes[0]?.position?.x}</span>
      <span data-testid="node-y">{nodes[0]?.position?.y}</span>
    </div>
  );
};

describe('FunnelProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces state synchronization calls', () => {
    const onStateChangeMock = jest.fn();
    const initialNodes = [
      { id: '1', position: { x: 0, y: 0 } }
    ];

    let updateNodeFn;
    const testAction = (fn) => {
      updateNodeFn = fn;
    };

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChangeMock}
        autoSync={true}
      >
        <FunnelConsumerTest testAction={testAction} />
      </FunnelProvider>
    );

    // Initial render and effect execution (with initial timers started)
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Fast-forward initial debounce
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);
    onStateChangeMock.mockClear();

    // Perform multiple rapid updates (simulating dragging)
    act(() => {
      updateNodeFn('1', 10, 20);
    });
    act(() => {
      updateNodeFn('1', 20, 30);
    });
    act(() => {
      updateNodeFn('1', 30, 40);
    });

    // None should have triggered onStateChange yet due to debounce
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Advance by less than debounce time (100ms)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Advance rest of the time to trigger the debounce handler (50ms)
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);
    expect(onStateChangeMock).toHaveBeenCalledWith({
      nodes: [{ id: '1', position: { x: 30, y: 40 } }],
      edges: []
    });
  });

  test('bails out and does not update or trigger sync when position is unchanged', () => {
    const onStateChangeMock = jest.fn();
    const initialNodes = [
      { id: '1', position: { x: 10, y: 20 } }
    ];

    let updateNodeFn;
    const testAction = (fn) => {
      updateNodeFn = fn;
    };

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChangeMock}
        autoSync={true}
      >
        <FunnelConsumerTest testAction={testAction} />
      </FunnelProvider>
    );

    // Run initial mounting timer
    act(() => {
      jest.advanceTimersByTime(150);
    });
    onStateChangeMock.mockClear();

    // Update with exact same position
    act(() => {
      updateNodeFn('1', 10, 20);
    });

    // Advance time and check that no callback was triggered
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChangeMock).not.toHaveBeenCalled();
  });
});
