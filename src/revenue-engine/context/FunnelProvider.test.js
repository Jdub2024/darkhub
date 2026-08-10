import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

jest.useFakeTimers();

const TestComponent = () => {
  const { nodes, updateNodePosition } = useFunnel();
  return (
    <div>
      <span data-testid="node-pos">
        {nodes[0].position.x},{nodes[0].position.y}
      </span>
      <button
        data-testid="move-btn"
        onClick={() => updateNodePosition('node_1', 100, 200)}
      >
        Move
      </button>
      <button
        data-testid="move-same-btn"
        onClick={() => updateNodePosition('node_1', 10, 20)}
      >
        Move Same
      </button>
    </div>
  );
};

describe('FunnelProvider', () => {
  const initialNodes = [
    {
      id: 'node_1',
      type: 'traffic',
      label: 'Node 1',
      position: { x: 10, y: 20 },
      metrics: {},
    },
  ];

  test('debounces state synchronization updates via onStateChange', () => {
    const onStateChange = jest.fn();
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial mount triggers an effect. Let's let that timer resolve and clear the mock.
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    onStateChange.mockClear();

    // Trigger state changes
    const moveBtn = screen.getByTestId('move-btn');
    act(() => {
      moveBtn.click();
    });

    // Should not have synced immediately
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance partial time
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance remaining time
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith({
      nodes: [
        {
          id: 'node_1',
          type: 'traffic',
          label: 'Node 1',
          position: { x: 100, y: 200 },
          metrics: {},
        },
      ],
      edges: [],
    });
  });

  test('bails out and does not update state if the position is the same', () => {
    const onStateChange = jest.fn();
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Let mount synchronization finish and clear
    act(() => {
      jest.advanceTimersByTime(150);
    });
    onStateChange.mockClear();

    const moveSameBtn = screen.getByTestId('move-same-btn');
    act(() => {
      moveSameBtn.click();
    });

    // Advancing timers should not trigger onStateChange since state did not change
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).not.toHaveBeenCalled();
  });
});
