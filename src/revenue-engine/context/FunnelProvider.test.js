import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onRender }) => {
  const funnel = useFunnel();
  if (onRender) onRender(funnel);
  return (
    <div>
      <span data-testid="node-count">{funnel.nodes.length}</span>
      <button
        data-testid="update-node-btn"
        onClick={() => funnel.updateNodePosition('n1', 100, 200)}
      >
        Move N1
      </button>
      <button
        data-testid="same-node-btn"
        onClick={() => funnel.updateNodePosition('n1', 0, 0)}
      >
        Move N1 Same
      </button>
    </div>
  );
};

describe('FunnelProvider', () => {
  const initialNodes = [
    { id: 'n1', position: { x: 0, y: 0 } },
    { id: 'n2', position: { x: 50, y: 50 } },
  ];
  const initialEdges = [{ id: 'e1', source: 'n1', target: 'n2' }];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides initial nodes and edges', () => {
    let contextVal = null;
    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestComponent onRender={(ctx) => (contextVal = ctx)} />
      </FunnelProvider>
    );

    expect(contextVal.nodes).toEqual(initialNodes);
    expect(contextVal.edges).toEqual(initialEdges);
  });

  it('debounces onStateChange calls when autoSync is true', () => {
    const onStateChange = jest.fn();

    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        autoSync={true}
        onStateChange={onStateChange}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial sync timer scheduled on mount
    expect(onStateChange).not.toHaveBeenCalled();

    // Fast-forward timers for initial sync
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Trigger position change
    act(() => {
      getByTestId('update-node-btn').click();
    });

    // Immediately before 150ms delay, onStateChange should not have been called again
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Fast-forward 150ms delay
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(2);
  });

  it('skips state updates if position coordinates have not changed', () => {
    let renderCount = 0;
    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestComponent
          onRender={() => {
            renderCount++;
          }}
        />
      </FunnelProvider>
    );

    const initialRenders = renderCount;

    // Attempting to update to the same coordinates (0, 0)
    act(() => {
      getByTestId('same-node-btn').click();
    });

    // Render count should remain unchanged
    expect(renderCount).toBe(initialRenders);
  });
});
