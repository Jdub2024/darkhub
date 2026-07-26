import React from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = () => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
      {nodes.map((node) => (
        <div key={node.id} data-testid={`node-${node.id}`}>
          {node.id}: {node.position.x}, {node.position.y}
          <button
            data-testid={`btn-move-${node.id}`}
            onClick={() => updateNodePosition(node.id, node.position.x + 10, node.position.y + 10)}
          >
            Move
          </button>
          <button
            data-testid={`btn-move-same-${node.id}`}
            onClick={() => updateNodePosition(node.id, node.position.x, node.position.y)}
          >
            Move Same
          </button>
        </div>
      ))}
    </div>
  );
};

describe('FunnelProvider Performance and Synchronization', () => {
  let initialNodes;
  let onStateChangeMock;

  beforeEach(() => {
    jest.useFakeTimers();
    initialNodes = [
      { id: 'node_1', position: { x: 100, y: 150 } }
    ];
    onStateChangeMock = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('provides initial nodes and edges to children', () => {
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent />
      </FunnelProvider>
    );

    expect(screen.getByTestId('node-node_1')).toHaveTextContent('node_1: 100, 150');
  });

  test('debounces high-frequency state updates to onStateChange', () => {
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChangeMock}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    const moveBtn = screen.getByTestId('btn-move-node_1');

    // Trigger multiple high-frequency move events
    act(() => {
      fireEvent.click(moveBtn);
    });
    act(() => {
      fireEvent.click(moveBtn);
    });
    act(() => {
      fireEvent.click(moveBtn);
    });

    // At this point, no external sync should have occurred due to debouncing
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Fast-forward time but not enough to reach the 150ms threshold
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Fast-forward past the 150ms threshold
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Callback should have been called exactly once with the latest values
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);
    expect(onStateChangeMock).toHaveBeenCalledWith({
      nodes: [{ id: 'node_1', position: { x: 130, y: 180 } }],
      edges: []
    });
  });

  test('bails out of state updates when coordinates are identical', () => {
    let renderCount = 0;
    const Tracker = () => {
      renderCount++;
      return null;
    };

    render(
      <FunnelProvider initialNodes={initialNodes}>
        <Tracker />
        <TestComponent />
      </FunnelProvider>
    );

    const moveSameBtn = screen.getByTestId('btn-move-same-node_1');

    // Reset render counter after initial mount
    renderCount = 0;

    // Trigger update with the same coordinates
    act(() => {
      fireEvent.click(moveSameBtn);
    });

    // Rendering should not happen again because of the bailout optimization
    expect(renderCount).toBe(0);
  });
});
