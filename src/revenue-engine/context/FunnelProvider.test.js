import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Custom test component to consume hook and verify actions
const TestConsumer = ({ onRender, dragCoords }) => {
  const { nodes, updateNodePosition } = useFunnel();

  React.useEffect(() => {
    if (dragCoords) {
      // Simulate high-frequency updates
      dragCoords.forEach(([x, y]) => {
        updateNodePosition('node_1', x, y);
      });
    }
  }, [dragCoords, updateNodePosition]);

  onRender(nodes);
  return null;
};

describe('FunnelProvider Performance Optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces state synchronization (onStateChange) on high-frequency drag events', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 0, y: 0 } },
    ];

    const { rerender } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestConsumer onRender={() => {}} />
      </FunnelProvider>
    );

    // Initial sync of state (triggered on mount / initial state load)
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Trigger high-frequency state updates
    rerender(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestConsumer
          onRender={() => {}}
          dragCoords={[
            [10, 10],
            [11, 11],
            [12, 12],
            [13, 13],
          ]}
        />
      </FunnelProvider>
    );

    // Timers haven't advanced, so onStateChange should not have been called yet
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance by less than 150ms
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance past 150ms to verify exactly 1 synchronized update is sent
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [{ id: 'node_1', position: { x: 13, y: 13 } }],
      edges: [],
    });
  });

  test('bails out of state updates (equality guard) when positions do not change', () => {
    const handleRender = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 100, y: 100 } },
    ];

    const { rerender } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer onRender={handleRender} />
      </FunnelProvider>
    );

    handleRender.mockClear();

    // Re-render with same coordinate update to trigger updateNodePosition
    rerender(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer
          onRender={handleRender}
          dragCoords={[
            [100, 100],
            [100, 100],
          ]}
        />
      </FunnelProvider>
    );

    // Because the state update bailed out, the component should not have triggered extra state change renders.
    // Note: The parent or container renders once initially when we pass new props (dragCoords),
    // but React's state setter bails out of any state-update-induced re-renders.
    expect(handleRender).toHaveBeenCalledTimes(1);
  });
});
