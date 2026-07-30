import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// A test component to easily access and test the useFunnel context API
const TestConsumer = ({ onHookValue }) => {
  const hookValue = useFunnel();
  React.useEffect(() => {
    onHookValue(hookValue);
  }, [hookValue, onHookValue]);
  return null;
};

describe('FunnelProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should debounce the onStateChange callback by 150ms during high-frequency updates', () => {
    const onStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 0, y: 0 } }
    ];

    let hook;
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestConsumer onHookValue={(val) => { hook = val; }} />
      </FunnelProvider>
    );

    // Initial state is loaded, trigger quick consecutive drag position updates
    act(() => {
      hook.updateNodePosition('node_1', 10, 10);
    });
    act(() => {
      hook.updateNodePosition('node_1', 20, 20);
    });
    act(() => {
      hook.updateNodePosition('node_1', 30, 30);
    });

    // Verify callback hasn't fired yet since 150ms hasn't elapsed
    expect(onStateChange).not.toHaveBeenCalled();

    // Fast-forward time by 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Fast-forward the remaining 50ms (total 150ms)
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Callback should have been called exactly once with the latest state
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith({
      nodes: [{ id: 'node_1', position: { x: 30, y: 30 } }],
      edges: []
    });
  });

  test('should bail out and keep the same nodes reference when position coordinates do not change', () => {
    const initialNodes = [
      { id: 'node_1', position: { x: 10, y: 10 } }
    ];

    let hook;
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer onHookValue={(val) => { hook = val; }} />
      </FunnelProvider>
    );

    const initialNodesRef = hook.nodes;

    // Call updateNodePosition with the exact same coordinate values
    act(() => {
      hook.updateNodePosition('node_1', 10, 10);
    });

    // Reference of nodes array should remain identical (state update bailed out)
    expect(hook.nodes).toBe(initialNodesRef);
  });

  test('should bail out when target node id is not found', () => {
    const initialNodes = [
      { id: 'node_1', position: { x: 10, y: 10 } }
    ];

    let hook;
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer onHookValue={(val) => { hook = val; }} />
      </FunnelProvider>
    );

    const initialNodesRef = hook.nodes;

    // Try updating a non-existent node
    act(() => {
      hook.updateNodePosition('non_existent_node', 20, 20);
    });

    // Reference of nodes array should remain identical (state update bailed out)
    expect(hook.nodes).toBe(initialNodesRef);
  });
});
