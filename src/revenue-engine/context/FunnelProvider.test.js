import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Custom test component wrapping the provider and utilizing the hook.
// This is to avoid prop-drilling or hook-wrapper mismatch bugs.
const TestComponent = ({ onNodeUpdate }) => {
  const { nodes, updateNodePosition } = useFunnel();

  React.useEffect(() => {
    if (onNodeUpdate) {
      onNodeUpdate(updateNodePosition);
    }
  }, [updateNodePosition, onNodeUpdate]);

  return (
    <div>
      {nodes.map((node) => (
        <div key={node.id} data-testid={node.id}>
          {node.position.x},{node.position.y}
        </div>
      ))}
    </div>
  );
};

describe('FunnelProvider performance optimizations', () => {
  const initialNodes = [
    {
      id: 'node_1',
      type: 'traffic',
      label: 'Node 1',
      position: { x: 10, y: 10 },
      metrics: {},
    },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces state synchronization frequency to prevent high-frequency updates', () => {
    const onStateChange = jest.fn();

    let updatePosition;
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={[]}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestComponent onNodeUpdate={(updater) => { updatePosition = updater; }} />
      </FunnelProvider>
    );

    // Initial sync might run or not depending on state initialization.
    // Let's reset the mock to start clean.
    onStateChange.mockClear();

    // High frequency position updates
    act(() => {
      updatePosition('node_1', 11, 10);
    });
    act(() => {
      updatePosition('node_1', 12, 10);
    });
    act(() => {
      updatePosition('node_1', 13, 10);
    });

    // Before timer ticks, onStateChange should not have been called
    expect(onStateChange).not.toHaveBeenCalled();

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // It should have been called only once with the latest state
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange.mock.calls[0][0].nodes[0].position).toEqual({ x: 13, y: 10 });
  });

  test('bails out of state updates if position remains unchanged (equality guard)', () => {
    let updatePosition;
    let renderCount = 0;

    const TrackingComponent = ({ onNodeUpdate }) => {
      const { nodes, updateNodePosition } = useFunnel();
      renderCount++;

      React.useEffect(() => {
        if (onNodeUpdate) {
          onNodeUpdate(updateNodePosition);
        }
      }, [updateNodePosition, onNodeUpdate]);

      return (
        <div data-testid="node_x">
          {nodes[0].position.x}
        </div>
      );
    };

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={[]}
        autoSync={false}
      >
        <TrackingComponent onNodeUpdate={(updater) => { updatePosition = updater; }} />
      </FunnelProvider>
    );

    const initialRenderCount = renderCount;

    // Update with exact same position coordinates
    act(() => {
      updatePosition('node_1', 10, 10);
    });

    // Render count should not have increased because of equality guard returning previous state
    expect(renderCount).toBe(initialRenderCount);
  });
});
