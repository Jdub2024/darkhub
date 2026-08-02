import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Custom test consumer component to test the provider hooks safely and efficiently without prop-drilling or hook-wrapper mismatch
const TestConsumer = ({ onDrag }) => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
      <div data-testid="nodes-count">{nodes.length}</div>
      <div data-testid="node-position-x">{nodes[0]?.position.x}</div>
      <div data-testid="node-position-y">{nodes[0]?.position.y}</div>
      <button
        data-testid="drag-btn"
        onClick={() => {
          if (onDrag) {
            onDrag(updateNodePosition);
          } else {
            updateNodePosition('node_1', 100, 200);
          }
        }}
      >
        Drag Node
      </button>
    </div>
  );
};

describe('FunnelProvider Performance and Correctness', () => {
  let initialNodes;

  beforeEach(() => {
    initialNodes = [
      { id: 'node_1', position: { x: 50, y: 50 }, label: 'Test Node 1' },
      { id: 'node_2', position: { x: 150, y: 150 }, label: 'Test Node 2' },
    ];
  });

  test('provides correct initial nodes', () => {
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer />
      </FunnelProvider>
    );

    expect(screen.getByTestId('nodes-count')).toHaveTextContent('2');
    expect(screen.getByTestId('node-position-x')).toHaveTextContent('50');
  });

  test('updates node position correctly', () => {
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer />
      </FunnelProvider>
    );

    act(() => {
      screen.getByTestId('drag-btn').click();
    });

    expect(screen.getByTestId('node-position-x')).toHaveTextContent('100');
    expect(screen.getByTestId('node-position-y')).toHaveTextContent('200');
  });

  test('bails out of state updates when positions are identical (Equality Guard)', () => {
    let renderCount = 0;

    const Watcher = () => {
      useFunnel();
      renderCount++;
      return null;
    };

    render(
      <FunnelProvider initialNodes={initialNodes}>
        <Watcher />
        <TestConsumer />
      </FunnelProvider>
    );

    // Initial render count = 1
    const initialRenders = renderCount;

    // First update changes coordinates (50, 50 -> 100, 200) -> should trigger re-render
    act(() => {
      screen.getByTestId('drag-btn').click();
    });
    const rendersAfterFirstUpdate = renderCount;
    expect(rendersAfterFirstUpdate).toBeGreaterThan(initialRenders);

    // Second update with identical coordinates (100, 200 -> 100, 200) -> should NOT trigger re-render
    act(() => {
      screen.getByTestId('drag-btn').click();
    });
    expect(renderCount).toBe(rendersAfterFirstUpdate);
  });

  test('debounces state synchronization frequency on high frequency updates', () => {
    jest.useFakeTimers();
    const mockOnStateChange = jest.fn();

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={mockOnStateChange}
        autoSync={true}
      >
        <TestConsumer
          onDrag={(update) => {
            update('node_1', 60, 60);
            update('node_1', 70, 70);
            update('node_1', 80, 80);
          }}
        />
      </FunnelProvider>
    );

    // The effect runs initially to sync the initial state, let's fast-forward it first
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    mockOnStateChange.mockClear();

    // Trigger high frequency drag updates in a single tick
    act(() => {
      screen.getByTestId('drag-btn').click();
    });

    // Verify callback hasn't fired yet because it is debounced by 150ms
    expect(mockOnStateChange).not.toHaveBeenCalled();

    // Partially advance timer
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(mockOnStateChange).not.toHaveBeenCalled();

    // Advance remainder of timer
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Callback should fire exactly once with the latest state
    expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    expect(mockOnStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 80, y: 80 }, label: 'Test Node 1' },
        { id: 'node_2', position: { x: 150, y: 150 }, label: 'Test Node 2' },
      ],
      edges: [],
    });

    jest.useRealTimers();
  });
});
