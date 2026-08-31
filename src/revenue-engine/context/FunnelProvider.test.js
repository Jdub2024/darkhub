import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const initialNodes = [
  { id: 'node_1', type: 'traffic', label: 'Test Node', position: { x: 100, y: 100 }, metrics: {} },
];

const TestConsumer = ({ onRenderNodes }) => {
  const { nodes, updateNodePosition } = useFunnel();

  if (onRenderNodes) {
    onRenderNodes(nodes);
  }

  return (
    <div>
      <button
        data-testid="move-btn"
        onClick={() => updateNodePosition('node_1', 150, 150)}
      >
        Move
      </button>
      <button
        data-testid="move-same-btn"
        onClick={() => updateNodePosition('node_1', 100, 100)}
      >
        Move Same
      </button>
    </div>
  );
};

describe('FunnelProvider performance optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  test('debounces state synchronization on autoSync', () => {
    const handleStateChange = jest.fn();

    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestConsumer />
      </FunnelProvider>
    );

    // Let mount timer complete and clear mock
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    const moveBtn = getByTestId('move-btn');

    // Simulate 10 rapid position updates (10ms apart)
    act(() => {
      for (let i = 0; i < 10; i++) {
        moveBtn.click();
        jest.advanceTimersByTime(10);
      }
    });

    // Before timer elapses after last event, callback shouldn't be called
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance 150ms past last event
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should be called exactly once
    expect(handleStateChange).toHaveBeenCalledTimes(1);
  });

  test('bails out updateNodePosition when coordinates have not changed', () => {
    let renderCount = 0;
    let lastNodesRef = null;

    const onRenderNodes = (nodes) => {
      renderCount++;
      lastNodesRef = nodes;
    };

    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer onRenderNodes={onRenderNodes} />
      </FunnelProvider>
    );

    const initialNodesRef = lastNodesRef;
    const initialRenderCount = renderCount;

    const moveSameBtn = getByTestId('move-same-btn');

    act(() => {
      moveSameBtn.click();
    });

    // Node array reference should remain unchanged and no extra render triggered
    expect(lastNodesRef).toBe(initialNodesRef);
    expect(renderCount).toBe(initialRenderCount);
  });
});
