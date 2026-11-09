import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Helper test component to interact with FunnelContext
const TestConsumer = ({ onRender }) => {
  const { nodes, edges, updateNodePosition } = useFunnel();
  if (onRender) onRender({ nodes, edges });

  return (
    <div>
      <div data-testid="node-count">{nodes.length}</div>
      {nodes.map((node) => (
        <div key={node.id} data-testid={`node-${node.id}`}>
          {node.position.x},{node.position.y}
        </div>
      ))}
      <button
        data-testid="move-node-1"
        onClick={() => updateNodePosition('n1', 100, 200)}
      >
        Move N1
      </button>
      <button
        data-testid="noop-node-1"
        onClick={() => updateNodePosition('n1', 10, 20)}
      >
        Noop N1
      </button>
      <button
        data-testid="move-missing-node"
        onClick={() => updateNodePosition('missing', 999, 999)}
      >
        Move Missing
      </button>
    </div>
  );
};

describe('FunnelProvider Performance Optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  const initialNodes = [
    { id: 'n1', type: 'traffic', position: { x: 10, y: 20 } },
    { id: 'n2', type: 'landing', position: { x: 30, y: 40 } },
  ];
  const initialEdges = [
    { id: 'e1', source: 'n1', target: 'n2', isActive: true },
  ];

  test('updateNodePosition updates coordinates properly', () => {
    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestConsumer />
      </FunnelProvider>
    );

    expect(screen.getByTestId('node-n1')).toHaveTextContent('10,20');

    act(() => {
      screen.getByTestId('move-node-1').click();
    });

    expect(screen.getByTestId('node-n1')).toHaveTextContent('100,200');
  });

  test('updateNodePosition skips re-renders and bails out when coordinates do not change', () => {
    let renderCount = 0;
    let lastNodesRef = null;

    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestConsumer
          onRender={({ nodes }) => {
            renderCount += 1;
            lastNodesRef = nodes;
          }}
        />
      </FunnelProvider>
    );

    const initialRenderCount = renderCount;
    const initialReference = lastNodesRef;

    // Trigger update with the exact same coordinates (10, 20)
    act(() => {
      screen.getByTestId('noop-node-1').click();
    });

    // Render count should NOT increase because state update bailed out
    expect(renderCount).toBe(initialRenderCount);
    expect(lastNodesRef).toBe(initialReference);

    // Trigger update for non-existent node
    act(() => {
      screen.getByTestId('move-missing-node').click();
    });

    expect(renderCount).toBe(initialRenderCount);
    expect(lastNodesRef).toBe(initialReference);
  });

  test('debounces onStateChange when autoSync is enabled during rapid updates', () => {
    const handleStateChange = jest.fn();

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestConsumer />
      </FunnelProvider>
    );

    // Initial mount effect queues debounce timer
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance timer to let mount sync resolve and clear call count
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Perform rapid successive node position changes (simulating 60fps drag)
    act(() => {
      screen.getByTestId('move-node-1').click();
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Intermediate time before debounce duration completes - should NOT fire yet
    expect(handleStateChange).not.toHaveBeenCalled();

    // Complete the remaining debounce interval
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should have batched into a single call with latest state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'n1', type: 'traffic', position: { x: 100, y: 200 } },
        { id: 'n2', type: 'landing', position: { x: 30, y: 40 } },
      ],
      edges: initialEdges,
    });
  });

  test('synchronously flushes pending debounced state on unmount without data loss', () => {
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

    // Resolve initial mount timer
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger update right before unmounting
    act(() => {
      screen.getByTestId('move-node-1').click();
    });

    expect(handleStateChange).not.toHaveBeenCalled();

    // Unmount before 150ms passes
    unmount();

    // Pending state should be flushed synchronously
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'n1', type: 'traffic', position: { x: 100, y: 200 } },
        { id: 'n2', type: 'landing', position: { x: 30, y: 40 } },
      ],
      edges: initialEdges,
    });
  });
});
