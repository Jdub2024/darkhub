import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Custom test component to avoid using renderHook and to test the hook cleanly in a React context
const TestComponent = () => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
      <div data-testid="nodes-count">{nodes.length}</div>
      {nodes.map((node) => (
        <div key={node.id} data-testid={`node-${node.id}`}>
          {node.label} - {node.position.x},{node.position.y}
          <button
            data-testid={`btn-move-${node.id}`}
            onClick={() => updateNodePosition(node.id, node.position.x + 10, node.position.y + 10)}
          >
            Move
          </button>
          <button
            data-testid={`btn-noop-${node.id}`}
            onClick={() => updateNodePosition(node.id, node.position.x, node.position.y)}
          >
            Noop
          </button>
        </div>
      ))}
      <button
        data-testid="btn-invalid-move"
        onClick={() => updateNodePosition('invalid-id', 100, 100)}
      >
        Invalid Move
      </button>
    </div>
  );
};

describe('FunnelProvider Performance & Synchronization', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const initialNodes = [
    {
      id: 'node_1',
      label: 'Node 1',
      position: { x: 10, y: 20 },
      metrics: {},
    },
  ];

  test('debounces state synchronization on high-frequency node updates', () => {
    const handleStateChange = jest.fn();

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Consume the initial mount synchronization call
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Trigger multiple high-frequency updates
    const moveBtn = screen.getByTestId('btn-move-node_1');

    act(() => {
      fireEvent.click(moveBtn);
    });
    act(() => {
      fireEvent.click(moveBtn);
    });
    act(() => {
      fireEvent.click(moveBtn);
    });

    // Verify callback hasn't been called yet before timers run
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward by 100ms (less than 150ms debounce)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward by another 50ms (reaching 150ms total)
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Callback should have been called exactly once with the latest state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        expect.objectContaining({
          id: 'node_1',
          position: { x: 40, y: 50 }, // 10 + 10 + 10 + 10, 20 + 10 + 10 + 10
        }),
      ],
      edges: [],
    });
  });

  test('bails out of state updates when positions are unchanged or node is not found', () => {
    const handleStateChange = jest.fn();

    // Render the provider
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Consume the initial mount synchronization call
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Click Noop button (no-op coordinate change)
    const noopBtn = screen.getByTestId('btn-noop-node_1');
    act(() => {
      fireEvent.click(noopBtn);
    });

    // Advance time and check that state sync wasn't queued or scheduled since there was a state update bail-out
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Click invalid move button (node index -1)
    const invalidBtn = screen.getByTestId('btn-invalid-move');
    act(() => {
      fireEvent.click(invalidBtn);
    });

    // Advance time and check that state sync wasn't scheduled
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).not.toHaveBeenCalled();
  });
});
