import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

describe('FunnelProvider Performance Optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('debounces onStateChange calls when autoSync is true', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [
      { id: '1', position: { x: 0, y: 0 } },
    ];

    let contextValue;
    function Consumer() {
      contextValue = useFunnel();
      return (
        <div>
          <button
            onClick={() => contextValue.updateNodePosition('1', 10, 20)}
            data-testid="update-btn"
          >
            Update
          </button>
        </div>
      );
    }

    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={[]}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <Consumer />
      </FunnelProvider>
    );

    // Initial mount triggers timer; resolve it and clear initial call
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Trigger multiple high-frequency updates (simulating drag events)
    act(() => {
      getByTestId('update-btn').click();
      contextValue.updateNodePosition('1', 12, 22);
      contextValue.updateNodePosition('1', 15, 25);
    });

    // Before timer completes, callback should not be invoked
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward 100ms (not yet 150ms)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward remaining 50ms
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [{ id: '1', position: { x: 15, y: 25 } }],
      edges: [],
    });
  });

  test('bails out of state update when position is unchanged', () => {
    const initialNodes = [
      { id: '1', position: { x: 10, y: 20 } },
    ];

    let renderCount = 0;
    let contextValue;
    function Consumer() {
      contextValue = useFunnel();
      renderCount++;
      return <div data-testid="pos">{contextValue.nodes[0].position.x}</div>;
    }

    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={[]}>
        <Consumer />
      </FunnelProvider>
    );

    const initialRenderCount = renderCount;

    // Call updateNodePosition with exact same position
    act(() => {
      contextValue.updateNodePosition('1', 10, 20);
    });

    // Render count should not have increased because state update was skipped
    expect(renderCount).toBe(initialRenderCount);

    // Call updateNodePosition for non-existent node
    act(() => {
      contextValue.updateNodePosition('non-existent', 50, 50);
    });

    expect(renderCount).toBe(initialRenderCount);
  });

  test('flushes latest state on unmount if autoSync is true', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [
      { id: '1', position: { x: 0, y: 0 } },
    ];

    let contextValue;
    function Consumer() {
      contextValue = useFunnel();
      return null;
    }

    const { unmount } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={[]}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <Consumer />
      </FunnelProvider>
    );

    // Resolve initial mount timer
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger update right before unmounting
    act(() => {
      contextValue.updateNodePosition('1', 50, 60);
    });

    // Unmount before debounce timer finishes
    unmount();

    // Latest state should have been flushed immediately
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [{ id: '1', position: { x: 50, y: 60 } }],
      edges: [],
    });
  });
});
