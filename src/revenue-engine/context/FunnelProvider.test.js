import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Custom component to access Context state and update functions
const TestConsumer = ({ onRender }) => {
  const { nodes, updateNodePosition } = useFunnel();
  if (onRender) {
    onRender(updateNodePosition);
  }
  return <div data-testid="nodes-count">{nodes.length}</div>;
};

describe('FunnelProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    cleanup();
  });

  it('debounces autoSync onStateChange calls during rapid state updates', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 0, y: 0 } },
    ];

    let updatePos;
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestConsumer onRender={(updateFn) => { updatePos = updateFn; }} />
      </FunnelProvider>
    );

    // Initial mount triggers useEffect timeout schedule.
    // Advance timer so initial mount sync completes.
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Simulate 10 rapid node drag moves (high-frequency updates)
    act(() => {
      for (let i = 1; i <= 10; i++) {
        updatePos('node_1', i * 10, i * 10);
        jest.advanceTimersByTime(20); // updates every 20ms (< 150ms debounce delay)
      }
    });

    // During rapid updates before timer completes, onStateChange should NOT have been called yet
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance remaining debounce delay
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should only be called ONCE with the final updated state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [{ id: 'node_1', position: { x: 100, y: 100 } }],
      edges: [],
    });
  });

  it('does not trigger onStateChange when autoSync is false', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [{ id: 'node_1', position: { x: 0, y: 0 } }];

    let updatePos;
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={false}
        onStateChange={handleStateChange}
      >
        <TestConsumer onRender={(updateFn) => { updatePos = updateFn; }} />
      </FunnelProvider>
    );

    act(() => {
      updatePos('node_1', 50, 50);
      jest.advanceTimersByTime(200);
    });

    expect(handleStateChange).not.toHaveBeenCalled();
  });
});
