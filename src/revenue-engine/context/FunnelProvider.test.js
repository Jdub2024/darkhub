import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const initialNodes = [
  { id: 'node_1', position: { x: 0, y: 0 } },
  { id: 'node_2', position: { x: 100, y: 100 } },
];

const TestConsumer = ({ onHookValue }) => {
  const funnel = useFunnel();
  if (onHookValue) {
    onHookValue(funnel);
  }
  return (
    <div>
      <button
        data-testid="update-btn"
        onClick={() => funnel.updateNodePosition('node_1', 50, 50)}
      >
        Move Node
      </button>
      <button
        data-testid="update-same-btn"
        onClick={() => funnel.updateNodePosition('node_1', 0, 0)}
      >
        Move Node Same
      </button>
    </div>
  );
};

describe('FunnelProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('debounces state synchronization on high-frequency node updates', () => {
    const handleStateChange = jest.fn();
    let hookValue;

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestConsumer onHookValue={(val) => (hookValue = val)} />
      </FunnelProvider>
    );

    // Resolve initial mount debounce timer and clear mock
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Simulate high-frequency node updates (e.g., 20 updates in rapid succession during dragging)
    act(() => {
      for (let i = 1; i <= 20; i++) {
        hookValue.updateNodePosition('node_1', i * 10, i * 10);
      }
    });

    // Callback shouldn't have fired yet due to 150ms debounce
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward time past 150ms debounce threshold
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Assert that onStateChange was batched and called exactly once
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 200, y: 200 } },
        { id: 'node_2', position: { x: 100, y: 100 } },
      ],
      edges: [],
    });
  });

  test('flushes pending state sync on component unmount', () => {
    const handleStateChange = jest.fn();
    let hookValue;

    const { unmount } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestConsumer onHookValue={(val) => (hookValue = val)} />
      </FunnelProvider>
    );

    // Resolve initial mount debounce timer and clear mock
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Update node position
    act(() => {
      hookValue.updateNodePosition('node_1', 300, 300);
    });

    // Unmount before 150ms timer completes
    act(() => {
      unmount();
    });

    // Verify pending update was flushed immediately on unmount
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 300, y: 300 } },
        { id: 'node_2', position: { x: 100, y: 100 } },
      ],
      edges: [],
    });
  });

  test('bails out state update if position is unchanged', () => {
    const handleStateChange = jest.fn();
    let renderCount = 0;

    const RenderTracker = () => {
      const { updateNodePosition } = useFunnel();
      renderCount++;
      return (
        <button onClick={() => updateNodePosition('node_1', 0, 0)}>
          Noop
        </button>
      );
    };

    const { getByText } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <RenderTracker />
      </FunnelProvider>
    );

    act(() => {
      jest.advanceTimersByTime(150);
    });
    const initialRenders = renderCount;

    // Trigger update to same position (0, 0)
    act(() => {
      getByText('Noop').click();
    });

    // Render count should not increase because updateNodePosition bailed out
    expect(renderCount).toBe(initialRenders);
  });
});
