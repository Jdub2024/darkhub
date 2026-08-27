import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onRenderCount, onConsumerState }) => {
  const { nodes, updateNodePosition } = useFunnel();
  if (onRenderCount) onRenderCount();
  if (onConsumerState) onConsumerState({ nodes, updateNodePosition });
  return (
    <div>
      <button onClick={() => updateNodePosition('n1', 10, 20)}>Move N1 to 10,20</button>
      <button onClick={() => updateNodePosition('n1', 10, 20)}>Move N1 to 10,20 again</button>
      <button onClick={() => updateNodePosition('non_existent', 50, 50)}>Move invalid</button>
    </div>
  );
};

describe('FunnelProvider performance optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces autoSync onStateChange updates', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [{ id: 'n1', position: { x: 0, y: 0 } }];

    let consumerApi;
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestComponent onConsumerState={(state) => (consumerApi = state)} />
      </FunnelProvider>
    );

    // Initial mount triggers timer, let's fast forward past initial timer
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // High frequency position updates
    act(() => {
      consumerApi.updateNodePosition('n1', 1, 1);
      consumerApi.updateNodePosition('n1', 2, 2);
      consumerApi.updateNodePosition('n1', 3, 3);
    });

    // Before timer advances 150ms, onStateChange should not be called again
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance timers by 150ms
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should only be called once for batched updates
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [{ id: 'n1', position: { x: 3, y: 3 } }],
      edges: [],
    });
  });

  test('bails out of state updates when node position does not change', () => {
    let renderCount = 0;
    let consumerApi;
    const initialNodes = [{ id: 'n1', position: { x: 10, y: 20 } }];

    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent
          onRenderCount={() => renderCount++}
          onConsumerState={(state) => (consumerApi = state)}
        />
      </FunnelProvider>
    );

    const initialRenders = renderCount;

    // Trigger update with exact same position
    act(() => {
      consumerApi.updateNodePosition('n1', 10, 20);
    });

    // Render count should not increase due to equality guard bail-out
    expect(renderCount).toBe(initialRenders);

    // Trigger update for non-existent node
    act(() => {
      consumerApi.updateNodePosition('n999', 100, 100);
    });

    expect(renderCount).toBe(initialRenders);
  });
});
