import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Helper component to utilize and inspect FunnelProvider hook actions
const TestComponent = ({ renderCallback, idToUpdate, nextCoords }) => {
  const { nodes, updateNodePosition } = useFunnel();

  // Expose the current nodes and the update method to our tests
  renderCallback({ nodes, updateNodePosition });

  return (
    <div>
      {nodes.map((node) => (
        <div key={node.id} data-testid={node.id}>
          {node.id}: {node.position.x}, {node.position.y}
        </div>
      ))}
    </div>
  );
};

describe('FunnelProvider Performance Optimization', () => {
  let initialNodes;

  beforeEach(() => {
    jest.useFakeTimers();
    initialNodes = [
      {
        id: 'node_trf_001',
        type: 'traffic',
        label: 'Paid Meta Framework',
        position: { x: 60, y: 120 },
        metrics: { volume: '24k', cpc: '$0.38' },
      },
    ];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces state synchronization via autoSync and onStateChange', () => {
    const onStateChangeMock = jest.fn();

    let capturedProps = {};
    const renderCallback = (props) => {
      capturedProps = props;
    };

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={onStateChangeMock}
      >
        <TestComponent renderCallback={renderCallback} />
      </FunnelProvider>
    );

    // Initial render sets the debounce timer, but it hasn't fired yet
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Fast-forward time to trigger initial sync
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);

    // Simulate high-frequency node updates (e.g. 60fps dragging)
    act(() => {
      capturedProps.updateNodePosition('node_trf_001', 61, 120);
    });
    act(() => {
      capturedProps.updateNodePosition('node_trf_001', 62, 120);
    });
    act(() => {
      capturedProps.updateNodePosition('node_trf_001', 63, 120);
    });

    // None of these updates should trigger onStateChange immediately
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);

    // Advance time partly; still shouldn't fire
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);

    // Advance remainder of debounce period; should trigger exactly once
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChangeMock).toHaveBeenCalledTimes(2);
    expect(onStateChangeMock).toHaveBeenLastCalledWith({
      nodes: [
        {
          id: 'node_trf_001',
          type: 'traffic',
          label: 'Paid Meta Framework',
          position: { x: 63, y: 120 },
          metrics: { volume: '24k', cpc: '$0.38' },
        },
      ],
      edges: [],
    });
  });

  test('bails out of state updates when calling updateNodePosition with same coordinates', () => {
    let capturedProps = {};
    let renderCount = 0;

    const renderCallback = (props) => {
      capturedProps = props;
      renderCount++;
    };

    render(
      <FunnelProvider initialNodes={initialNodes} autoSync={false}>
        <TestComponent renderCallback={renderCallback} />
      </FunnelProvider>
    );

    // Render count after initial render
    const initialRenderCount = renderCount;

    // Call updateNodePosition with exact same position coordinates
    act(() => {
      capturedProps.updateNodePosition('node_trf_001', 60, 120);
    });

    // Verify that React optimization bailed out and did not perform a re-render
    expect(renderCount).toBe(initialRenderCount);
  });
});
