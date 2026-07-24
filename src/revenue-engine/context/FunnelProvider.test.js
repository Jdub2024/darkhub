import React, { act } from 'react';
import { render } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

jest.useFakeTimers();

// Testing Pattern: In testing React Context Hooks (like `useFunnel`), prefer rendering a custom test component wrapping the provider and utilizing the hook over using `renderHook` with complex wrappers.
const TestComponent = ({ onDrag }) => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
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
        Drag
      </button>
      <div data-testid="node-pos">
        {nodes[0]?.position.x},{nodes[0]?.position.y}
      </div>
    </div>
  );
};

describe('FunnelProvider performance optimizations', () => {
  const initialNodes = [
    {
      id: 'node_1',
      type: 'traffic',
      label: 'Meta',
      position: { x: 50, y: 50 },
      metrics: { val: '10' },
    },
  ];

  it('bails out of state updates if position values have not changed', () => {
    let renderCount = 0;
    const SpyComponent = () => {
      const { updateNodePosition } = useFunnel();
      renderCount++;
      return (
        <button data-testid="drag-btn" onClick={() => updateNodePosition('node_1', 50, 50)}>
          Drag
        </button>
      );
    };

    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <SpyComponent />
      </FunnelProvider>
    );

    const initialRenders = renderCount;

    // Trigger state update with the same coordinates
    act(() => {
      getByTestId('drag-btn').click();
    });

    // The component should not have re-rendered because we bailed out on state updates
    expect(renderCount).toBe(initialRenders);
  });

  it('debounces the external onStateChange callback', () => {
    const onStateChange = jest.fn();

    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
        <TestComponent />
      </FunnelProvider>
    );

    // Initial state trigger or debounce scheduling might run
    jest.advanceTimersByTime(150);
    onStateChange.mockClear();

    // Perform multiple fast drag movements (simulation)
    act(() => {
      getByTestId('drag-btn').click();
    });
    act(() => {
      getByTestId('drag-btn').click();
    });
    act(() => {
      getByTestId('drag-btn').click();
    });

    // No calls should happen immediately
    expect(onStateChange).not.toHaveBeenCalled();

    // After 100ms, still no calls (debounce interval is 150ms)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // After another 50ms (total 150ms), exactly 1 batched call should be executed
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith({
      nodes: [
        {
          id: 'node_1',
          type: 'traffic',
          label: 'Meta',
          position: { x: 100, y: 200 },
          metrics: { val: '10' },
        },
      ],
      edges: [],
    });
  });
});
