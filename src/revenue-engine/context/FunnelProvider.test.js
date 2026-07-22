import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

jest.useFakeTimers();

describe('FunnelProvider Performance & State Sync', () => {
  const initialNodes = [
    { id: 'node1', position: { x: 10, y: 20 }, label: 'Node 1', type: 'traffic', metrics: {} },
    { id: 'node2', position: { x: 100, y: 200 }, label: 'Node 2', type: 'checkout', metrics: {} },
  ];

  const initialEdges = [
    { id: 'edge1', source: 'node1', target: 'node2', isActive: true },
  ];

  test('bails out of state updates when positions are unchanged', () => {
    let renderCount = 0;
    const TestComponent = () => {
      const { updateNodePosition } = useFunnel();
      renderCount++;
      return (
        <button onClick={() => updateNodePosition('node1', 10, 20)}>
          Trigger Position
        </button>
      );
    };

    const { getByText } = render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestComponent />
      </FunnelProvider>
    );

    // Initial render count is 1
    expect(renderCount).toBe(1);

    // Click to update with the identical coordinates (10, 20)
    act(() => {
      getByText('Trigger Position').click();
    });

    // Render count should still be 1 (state bail-out)
    expect(renderCount).toBe(1);
  });

  test('debounces onStateChange callback during high-frequency updates', () => {
    const handleStateChange = jest.fn();

    const TestComponent = () => {
      const { updateNodePosition } = useFunnel();
      return (
        <button onClick={() => {
          for (let i = 1; i <= 22; i++) {
            updateNodePosition('node1', 10 + i, 20 + i);
          }
        }}>
          Trigger Move
        </button>
      );
    };

    const { getByText } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial mount sync is debounced
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward initial mount timeout
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Trigger high-frequency updates
    act(() => {
      getByText('Trigger Move').click();
    });

    // It shouldn't trigger immediately
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance by the remainder of the debounce window (150ms)
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // The callback should only be triggered once (all 22 updates coalesced)
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenLastCalledWith({
      nodes: [
        { id: 'node1', position: { x: 32, y: 42 }, label: 'Node 1', type: 'traffic', metrics: {} },
        { id: 'node2', position: { x: 100, y: 200 }, label: 'Node 2', type: 'checkout', metrics: {} },
      ],
      edges: initialEdges,
    });
  });

  test('onStateChange handles changing callbacks via ref without timer resetting/starvation', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const TestComponent = () => {
      const { updateNodePosition } = useFunnel();
      return (
        <button onClick={() => updateNodePosition('node1', 15, 25)}>
          Trigger
        </button>
      );
    };

    const TestWrapper = ({ onStateChange }) => (
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    const { rerender, getByText } = render(
      <TestWrapper onStateChange={callback1} />
    );

    // Fast-forward initial mount timer
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(callback1).toHaveBeenCalledTimes(1);
    callback1.mockClear();

    // Trigger update
    act(() => {
      getByText('Trigger').click();
    });

    // Rerender with callback2 before the debounce timer finishes
    rerender(<TestWrapper onStateChange={callback2} />);

    // Fast-forward timer by 150ms
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // callback1 should NOT be called, callback2 should be called exactly once since it was the latest ref
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
