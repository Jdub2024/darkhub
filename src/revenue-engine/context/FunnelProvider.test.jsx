import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Test consumer component
const TestConsumer = ({ onRender }) => {
  const { nodes, updateNodePosition } = useFunnel();
  if (onRender) onRender();

  return (
    <div>
      <div data-testid="node-x">{nodes[0]?.position?.x}</div>
      <button
        data-testid="move-btn"
        onClick={() => updateNodePosition('n1', 200, 300)}
      >
        Move
      </button>
      <button
        data-testid="same-pos-btn"
        onClick={() => updateNodePosition('n1', 100, 100)}
      >
        Same
      </button>
      <button
        data-testid="invalid-id-btn"
        onClick={() => updateNodePosition('nonexistent', 999, 999)}
      >
        Invalid
      </button>
    </div>
  );
};

describe('FunnelProvider performance optimizations', () => {
  const initialNodes = [
    { id: 'n1', type: 'traffic', label: 'Node 1', position: { x: 100, y: 100 }, metrics: {} },
  ];
  const initialEdges = [
    { id: 'e1', source: 'n1', target: 'n2', isActive: true },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('debounces onStateChange updates during rapid position changes', () => {
    const handleStateChange = jest.fn();

    const { unmount } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestConsumer />
      </FunnelProvider>
    );

    // Initial mount triggers first debounced sync; clear it
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Trigger multiple rapid moves (e.g. dragging across screen)
    act(() => {
      screen.getByTestId('move-btn').click();
    });

    // Before timer finishes, external callback should NOT have been invoked
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward partially
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward past the 150ms debounce threshold
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        expect.objectContaining({
          id: 'n1',
          position: { x: 200, y: 300 },
        }),
      ],
      edges: initialEdges,
    });

    unmount();
  });

  test('bails out of state updates when coordinates are unchanged', () => {
    let renderCount = 0;
    const handleRender = () => {
      renderCount++;
    };

    const { unmount } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        autoSync={false}
      >
        <TestConsumer onRender={handleRender} />
      </FunnelProvider>
    );

    expect(renderCount).toBe(1);

    // Click same-pos button (same x: 100, y: 100)
    act(() => {
      screen.getByTestId('same-pos-btn').click();
    });

    // Render count should NOT increment because state identity was preserved
    expect(renderCount).toBe(1);

    // Click invalid ID
    act(() => {
      screen.getByTestId('invalid-id-btn').click();
    });

    // Render count should NOT increment
    expect(renderCount).toBe(1);

    unmount();
  });

  test('flushes pending state synchronization on unmount', () => {
    const handleStateChange = jest.fn();

    const { unmount } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestConsumer />
      </FunnelProvider>
    );

    // Clear initial sync
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger move
    act(() => {
      screen.getByTestId('move-btn').click();
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Unmount while debounce timer is still pending
    unmount();

    // The unmount cleanup should immediately flush latest state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        expect.objectContaining({
          id: 'n1',
          position: { x: 200, y: 300 },
        }),
      ],
      edges: initialEdges,
    });
  });
});
