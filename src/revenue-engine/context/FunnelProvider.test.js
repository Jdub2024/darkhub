import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Custom Test Component wrapping the hook to avoid renderHook wrapper mismatch bugs
const TestComponent = () => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
      <div data-testid="node-pos">
        {nodes[0]?.position.x},{nodes[0]?.position.y}
      </div>
      <button
        data-testid="update-btn"
        onClick={() => updateNodePosition('node_1', 100, 200)}
      >
        Update Node 1
      </button>
      <button
        data-testid="noop-btn"
        onClick={() => updateNodePosition('node_1', 100, 200)}
      >
        Noop Update Node 1
      </button>
      <button
        data-testid="invalid-btn"
        onClick={() => updateNodePosition('non_existent', 500, 500)}
      >
        Invalid Node Update
      </button>
    </div>
  );
};

describe('FunnelProvider', () => {
  let initialNodes;
  let initialEdges;

  beforeEach(() => {
    jest.useFakeTimers();
    initialNodes = [
      { id: 'node_1', type: 'traffic', label: 'Node 1', position: { x: 10, y: 20 }, metrics: {} },
    ];
    initialEdges = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces onStateChange on high-frequency state updates', () => {
    const handleStateChange = jest.fn();

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    const updateButton = screen.getByTestId('update-btn');

    // Simulate high-frequency dragging updates (e.g., 5 rapid updates)
    act(() => {
      for (let i = 0; i < 5; i++) {
        // Change coords in each step
        fireEvent.click(updateButton);
      }
    });

    // onStateChange should not be called synchronously
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance time by 100ms (less than 150ms debounce time)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance time to complete the 150ms debounce time
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // It should have been called exactly once with the final state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', type: 'traffic', label: 'Node 1', position: { x: 100, y: 200 }, metrics: {} },
      ],
      edges: [],
    });
  });

  test('bails out of state updates when coordinates are unchanged', () => {
    const handleStateChange = jest.fn();

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Let the initial mount synchronization trigger
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    const updateButton = screen.getByTestId('update-btn');
    const noopButton = screen.getByTestId('noop-btn');

    // 1. Initial update to (100, 200)
    act(() => {
      fireEvent.click(updateButton);
    });

    // Let the timer run and trigger call
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);

    handleStateChange.mockClear();

    // 2. Trigger noop update with the same coordinates (100, 200)
    act(() => {
      fireEvent.click(noopButton);
    });

    // Since the coordinates are identical, it should bail out of the state update
    // meaning the debounce timer is never started and onStateChange is not scheduled.
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).not.toHaveBeenCalled();
  });

  test('bails out of state updates when node is not found', () => {
    const handleStateChange = jest.fn();

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Let the initial mount synchronization trigger
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    const invalidButton = screen.getByTestId('invalid-btn');

    act(() => {
      fireEvent.click(invalidButton);
    });

    // Since node is not found, state shouldn't change, onStateChange shouldn't be called
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).not.toHaveBeenCalled();
  });
});
