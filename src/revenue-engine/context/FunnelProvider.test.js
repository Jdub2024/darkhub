import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

jest.useFakeTimers();

describe('FunnelProvider Performance Optimizations', () => {
  const initialNodes = [
    { id: 'node1', position: { x: 10, y: 20 }, metrics: {} },
    { id: 'node2', position: { x: 30, y: 40 }, metrics: {} },
  ];

  const initialEdges = [{ id: 'edge1', source: 'node1', target: 'node2', isActive: true }];

  test('debounces state synchronization callback (onStateChange)', () => {
    const onStateChange = jest.fn();

    let funnelContextValue;
    const TestComponent = () => {
      funnelContextValue = useFunnel();
      return null;
    };

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial mount might trigger first sync. Let's advance timers and clear calls.
    act(() => {
      jest.advanceTimersByTime(150);
    });
    onStateChange.mockClear();

    // Perform high-frequency updates
    act(() => {
      funnelContextValue.updateNodePosition('node1', 11, 21);
    });
    act(() => {
      funnelContextValue.updateNodePosition('node1', 12, 22);
    });
    act(() => {
      funnelContextValue.updateNodePosition('node1', 13, 23);
    });

    // Check that onStateChange hasn't been called immediately (due to debouncing)
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance timer by 100ms (less than 150ms debounce threshold)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance timer to cross the 150ms threshold
    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node1', position: { x: 13, y: 23 }, metrics: {} },
        { id: 'node2', position: { x: 30, y: 40 }, metrics: {} },
      ],
      edges: initialEdges,
    });
  });

  test('updateNodePosition bails out and preserves reference if position is identical', () => {
    let funnelContextValue;
    const TestComponent = () => {
      funnelContextValue = useFunnel();
      return null;
    };

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        autoSync={false}
      >
        <TestComponent />
      </FunnelProvider>
    );

    const firstNodesRef = funnelContextValue.nodes;

    // Call updateNodePosition with exact same position
    act(() => {
      funnelContextValue.updateNodePosition('node1', 10, 20);
    });

    // Expecting exact reference equality for nodes array
    expect(funnelContextValue.nodes).toBe(firstNodesRef);

    // Call updateNodePosition with non-existent node
    act(() => {
      funnelContextValue.updateNodePosition('nonexistent', 100, 200);
    });

    // Expecting exact reference equality for nodes array
    expect(funnelContextValue.nodes).toBe(firstNodesRef);
  });
});
