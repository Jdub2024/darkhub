import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Custom test component to consume and expose Context values without complex wrappers or prop drilling.
// Performance Testing Pattern: Prefer rendering a custom test component wrapping the provider and utilizing the hook
// over using renderHook with complex wrappers to avoid prop-drilling or hook-wrapper mismatch bugs.
const TestConsumer = ({ onRender }) => {
  const funnel = useFunnel();
  onRender(funnel);
  return null;
};

describe('FunnelProvider Performance Patterns', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces state synchronization frequency on autoSync', () => {
    const onStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 0, y: 0 } }
    ];

    let currentFunnel;
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestConsumer onRender={(val) => { currentFunnel = val; }} />
      </FunnelProvider>
    );

    // Initial state setup should trigger initial sync after debounce
    expect(onStateChange).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Simulate high frequency movement updates (like dragging a node)
    act(() => {
      currentFunnel.updateNodePosition('node_1', 10, 10);
    });
    act(() => {
      currentFunnel.updateNodePosition('node_1', 20, 20);
    });
    act(() => {
      currentFunnel.updateNodePosition('node_1', 30, 30);
    });

    // None should be synchronized yet because of debouncing (150ms delay)
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Advance timer slightly (under 150ms)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Complete the remaining time to reach 150ms from last update
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChange).toHaveBeenCalledTimes(2);

    // Verify last update details
    expect(onStateChange).toHaveBeenLastCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 30, y: 30 } }
      ],
      edges: []
    });
  });

  test('bails out and returns same state reference when coordinates are identical', () => {
    const initialNodes = [
      { id: 'node_1', position: { x: 10, y: 20 } }
    ];

    let currentFunnel;
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer onRender={(val) => { currentFunnel = val; }} />
      </FunnelProvider>
    );

    const initialNodesRef = currentFunnel.nodes;

    // Call updateNodePosition with same coordinates
    act(() => {
      currentFunnel.updateNodePosition('node_1', 10, 20);
    });

    // Reference of nodes array should remain identical
    expect(currentFunnel.nodes).toBe(initialNodesRef);
  });

  test('bails out of state updates if node is not found', () => {
    const initialNodes = [
      { id: 'node_1', position: { x: 10, y: 20 } }
    ];

    let currentFunnel;
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer onRender={(val) => { currentFunnel = val; }} />
      </FunnelProvider>
    );

    const initialNodesRef = currentFunnel.nodes;

    // Call updateNodePosition with non-existent node ID
    act(() => {
      currentFunnel.updateNodePosition('non_existent', 50, 50);
    });

    // Reference of nodes array should remain identical
    expect(currentFunnel.nodes).toBe(initialNodesRef);
  });
});
