import React, { useEffect, useRef } from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

describe('FunnelProvider Performance Optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    cleanup();
  });

  const sampleNodes = [
    { id: 'node_1', position: { x: 10, y: 20 }, label: 'Node 1' },
    { id: 'node_2', position: { x: 50, y: 60 }, label: 'Node 2' },
  ];
  const sampleEdges = [{ id: 'edge_1', source: 'node_1', target: 'node_2' }];

  test('debounces onStateChange during rapid position updates', () => {
    const handleStateChange = jest.fn();
    let updateFn;

    const Consumer = () => {
      const { updateNodePosition } = useFunnel();
      updateFn = updateNodePosition;
      return null;
    };

    render(
      <FunnelProvider
        initialNodes={sampleNodes}
        initialEdges={sampleEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <Consumer />
      </FunnelProvider>
    );

    // Initial mount effect debounced call resolution
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Simulate rapid updates (e.g. 60fps drag over 20 frames)
    act(() => {
      for (let i = 1; i <= 20; i++) {
        updateFn('node_1', 10 + i, 20 + i);
        jest.advanceTimersByTime(16); // ~16ms per frame
      }
    });

    // Should NOT have called callback for every frame
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward remaining debounce window
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should only be called once with the final state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 30, y: 40 }, label: 'Node 1' },
        { id: 'node_2', position: { x: 50, y: 60 }, label: 'Node 2' },
      ],
      edges: sampleEdges,
    });
  });

  test('bails out of state updates when node position does not change or node not found', () => {
    let updateFn;
    let renderCount = 0;

    const Consumer = () => {
      const { nodes, updateNodePosition } = useFunnel();
      updateFn = updateNodePosition;
      const renderCountRef = useRef(0);
      renderCountRef.current += 1;
      renderCount = renderCountRef.current;
      return <div data-testid="node-count">{nodes.length}</div>;
    };

    render(
      <FunnelProvider initialNodes={sampleNodes} initialEdges={sampleEdges}>
        <Consumer />
      </FunnelProvider>
    );

    expect(renderCount).toBe(1);

    // Call updateNodePosition with exact same position
    act(() => {
      updateFn('node_1', 10, 20);
    });

    // Render count must remain 1 because React state update was skipped via reference equality
    expect(renderCount).toBe(1);

    // Call updateNodePosition with non-existent node
    act(() => {
      updateFn('non_existent_node', 999, 999);
    });

    expect(renderCount).toBe(1);

    // Call with new position should trigger render
    act(() => {
      updateFn('node_1', 15, 25);
    });

    expect(renderCount).toBe(2);
  });

  test('flushes pending state synchronization on unmount to prevent data loss', () => {
    const handleStateChange = jest.fn();
    let updateFn;

    const Consumer = () => {
      const { updateNodePosition } = useFunnel();
      updateFn = updateNodePosition;
      return null;
    };

    const { unmount } = render(
      <FunnelProvider
        initialNodes={sampleNodes}
        initialEdges={sampleEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <Consumer />
      </FunnelProvider>
    );

    // Clear mount debounce
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger update
    act(() => {
      updateFn('node_1', 100, 200);
    });

    // Unmount immediately without waiting 150ms
    unmount();

    // Unmount cleanup should synchronously flush the pending state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 100, y: 200 }, label: 'Node 1' },
        { id: 'node_2', position: { x: 50, y: 60 }, label: 'Node 2' },
      ],
      edges: sampleEdges,
    });
  });
});
