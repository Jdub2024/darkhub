import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

describe('FunnelProvider performance & functionality tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const initialNodes = [
    { id: 'node_1', position: { x: 10, y: 20 }, label: 'Test Node 1' },
    { id: 'node_2', position: { x: 50, y: 60 }, label: 'Test Node 2' },
  ];

  const TestConsumer = ({ onRender, onContextValue }) => {
    const context = useFunnel();
    if (onRender) onRender();
    if (onContextValue) onContextValue(context);
    return (
      <div>
        {context.nodes.map((n) => (
          <div key={n.id} data-testid={n.id}>
            {n.label}: {n.position.x},{n.position.y}
          </div>
        ))}
      </div>
    );
  };

  test('debounces onStateChange callback during rapid updates', () => {
    const handleStateChange = jest.fn();
    let currentContext;

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestConsumer onContextValue={(val) => { currentContext = val; }} />
      </FunnelProvider>
    );

    // Allow initial mount debounce timer to execute and clear initial call count
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger rapid position updates (e.g. dragging a node)
    act(() => {
      currentContext.updateNodePosition('node_1', 11, 21);
      currentContext.updateNodePosition('node_1', 12, 22);
      currentContext.updateNodePosition('node_1', 13, 23);
    });

    // Before timer advances, onStateChange should not have been called yet for the rapid updates
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward 150ms debounce delay
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Expect exactly 1 batched update call
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 13, y: 23 }, label: 'Test Node 1' },
        { id: 'node_2', position: { x: 50, y: 60 }, label: 'Test Node 2' },
      ],
      edges: [],
    });
  });

  test('equality guard skips state update if node coordinates do not change', () => {
    let renderCount = 0;
    let currentContext;

    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer
          onRender={() => { renderCount++; }}
          onContextValue={(val) => { currentContext = val; }}
        />
      </FunnelProvider>
    );

    const initialRenderCount = renderCount;

    // Call updateNodePosition with same coordinates
    act(() => {
      currentContext.updateNodePosition('node_1', 10, 20);
    });

    // Render count should remain unchanged due to equality guard skipping re-render
    expect(renderCount).toBe(initialRenderCount);

    // Call with non-existent node ID
    act(() => {
      currentContext.updateNodePosition('non_existent', 100, 200);
    });

    // Render count should still remain unchanged
    expect(renderCount).toBe(initialRenderCount);

    // Call with new coordinates
    act(() => {
      currentContext.updateNodePosition('node_1', 15, 25);
    });

    // Render count should increase by 1
    expect(renderCount).toBe(initialRenderCount + 1);
  });
});
