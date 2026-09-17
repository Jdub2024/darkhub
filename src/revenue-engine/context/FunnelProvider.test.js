import React from 'react';
import { render, act, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const initialNodes = [
  { id: 'node_1', position: { x: 10, y: 20 } },
  { id: 'node_2', position: { x: 100, y: 200 } },
];
const initialEdges = [{ id: 'edge_1', source: 'node_1', target: 'node_2' }];

const TestComponent = () => {
  const { nodes, updateNodePosition } = useFunnel();
  return (
    <div>
      <div data-testid="node-1-x">{nodes[0]?.position.x}</div>
      <div data-testid="node-1-y">{nodes[0]?.position.y}</div>
      <button
        data-testid="move-node-1"
        onClick={() => updateNodePosition('node_1', 50, 60)}
      >
        Move Node 1
      </button>
      <button
        data-testid="move-node-1-same"
        onClick={() => updateNodePosition('node_1', nodes[0]?.position.x, nodes[0]?.position.y)}
      >
        Move Node 1 Same
      </button>
      <button
        data-testid="move-nonexistent"
        onClick={() => updateNodePosition('invalid_id', 99, 99)}
      >
        Move Nonexistent
      </button>
    </div>
  );
};

describe('FunnelProvider performance & synchronization optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('debounces autoSync onStateChange during high-frequency node updates', () => {
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

    // Allow mount timer to resolve and clear mock
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger multiple high-frequency position updates
    const moveBtn = screen.getByTestId('move-node-1');
    act(() => {
      fireEvent.click(moveBtn);
    });

    // Before 150ms delay, onStateChange should not be called
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward 150ms
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // onStateChange should be called exactly once with latest state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 50, y: 60 } },
        { id: 'node_2', position: { x: 100, y: 200 } },
      ],
      edges: initialEdges,
    });
  });

  test('bails out of state updates when coordinates do not change', () => {
    const renderCountRef = { current: 0 };

    const RenderTracker = () => {
      const { updateNodePosition } = useFunnel();
      renderCountRef.current += 1;
      return (
        <button
          data-testid="same-pos-btn"
          onClick={() => updateNodePosition('node_1', 10, 20)}
        >
          Same Pos
        </button>
      );
    };

    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <RenderTracker />
      </FunnelProvider>
    );

    const initialRenders = renderCountRef.current;

    // Click with identical coordinates
    fireEvent.click(screen.getByTestId('same-pos-btn'));

    // Render count should stay the same because state update was bailed out
    expect(renderCountRef.current).toBe(initialRenders);
  });
});
