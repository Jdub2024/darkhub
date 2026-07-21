import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

describe('FunnelProvider Performance Optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const initialNodes = [
    { id: 'node1', position: { x: 10, y: 20 } }
  ];

  test('updateNodePosition with same coordinates does not trigger re-render / state update (referential equality)', () => {
    let renderCount = 0;
    let currentNodes = null;

    const TestConsumer = () => {
      const { nodes, updateNodePosition } = useFunnel();
      renderCount++;
      currentNodes = nodes;

      React.useEffect(() => {
        // Trigger update with SAME coordinates
        updateNodePosition('node1', 10, 20);
      }, [updateNodePosition]);

      return null;
    };

    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer />
      </FunnelProvider>
    );

    // Initial render is 1. If equality guard works, the subsequent updateNodePosition call with identical coordinates
    // should not update the nodes state, so renderCount should remain 1 (or at most not increase infinitely / cause unnecessary re-renders).
    // Specifically, setNodes state bail-out will keep nodes referentially identical, avoiding re-renders.
    const nodesRef1 = currentNodes;

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(currentNodes).toBe(nodesRef1);
    expect(renderCount).toBe(1);
  });

  test('debounces onStateChange callback during high-frequency movements', () => {
    const onStateChange = jest.fn();
    let triggerUpdate;

    const TestConsumer = () => {
      const { updateNodePosition } = useFunnel();
      triggerUpdate = updateNodePosition;
      return null;
    };

    render(
      <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
        <TestConsumer />
      </FunnelProvider>
    );

    // Initial callback invocation (optional, depending on initial render synchronization behavior in useEffect)
    // Actually, on initial render, useEffect fires. Let's clear the mock first.
    jest.advanceTimersByTime(150);
    onStateChange.mockClear();

    // Simulate rapid updates (e.g., during dragging)
    act(() => {
      triggerUpdate('node1', 11, 21);
    });
    act(() => {
      triggerUpdate('node1', 12, 22);
    });
    act(() => {
      triggerUpdate('node1', 13, 23);
    });

    // At this point, onStateChange should not have been called yet because of the 150ms debounce
    expect(onStateChange).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // It should have been called exactly once with the latest values
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.calls[0][0].nodes[0].position).toEqual({ x: 13, y: 23 });
  });
});
