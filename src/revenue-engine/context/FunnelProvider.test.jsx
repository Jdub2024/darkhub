import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

describe('FunnelProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const TestConsumer = ({ onUpdate }) => {
    const { nodes, edges, updateNodePosition } = useFunnel();

    return (
      <div>
        <div data-testid="nodes-count">{nodes.length}</div>
        <div data-testid="node-x">{nodes[0]?.position.x}</div>
        <div data-testid="node-y">{nodes[0]?.position.y}</div>
        <button
          onClick={() => {
            updateNodePosition('node-1', 100, 200);
            if (onUpdate) onUpdate();
          }}
        >
          Move Node
        </button>
        <button
          onClick={() => {
            updateNodePosition('node-1', 100, 200);
            if (onUpdate) onUpdate();
          }}
        >
          Move Same Node
        </button>
      </div>
    );
  };

  test('provides initial nodes and edges to consumers', () => {
    const initialNodes = [{ id: 'node-1', position: { x: 10, y: 20 } }];
    const initialEdges = [{ id: 'edge-1', source: 'node-1', target: 'node-2' }];

    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestConsumer />
      </FunnelProvider>
    );

    expect(screen.getByTestId('nodes-count')).toHaveTextContent('1');
    expect(screen.getByTestId('node-x')).toHaveTextContent('10');
    expect(screen.getByTestId('node-y')).toHaveTextContent('20');
  });

  test('debounces onStateChange when autoSync is true', () => {
    const onStateChange = jest.fn();
    const initialNodes = [{ id: 'node-1', position: { x: 10, y: 20 } }];

    render(
      <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
        <TestConsumer />
      </FunnelProvider>
    );

    // Initial mount effect is scheduled
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance timers by less than debounce time
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance timers past debounce time
    act(() => {
      jest.advanceTimersByTime(60);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith({
      nodes: initialNodes,
      edges: [],
    });
  });

  test('equality guard skips state update when coordinates do not change', () => {
    const initialNodes = [{ id: 'node-1', position: { x: 100, y: 200 } }];
    let renderCount = 0;

    const RenderCountingConsumer = () => {
      const { nodes, updateNodePosition } = useFunnel();
      renderCount++;

      return (
        <div>
          <span data-testid="node-x">{nodes[0]?.position.x}</span>
          <button onClick={() => updateNodePosition('node-1', 100, 200)}>
            Move Unchanged
          </button>
        </div>
      );
    };

    render(
      <FunnelProvider initialNodes={initialNodes}>
        <RenderCountingConsumer />
      </FunnelProvider>
    );

    expect(renderCount).toBe(1);

    // Trigger update with identical coordinates
    act(() => {
      screen.getByText('Move Unchanged').click();
    });

    // Should NOT re-render because equality guard returned prevNodes
    expect(renderCount).toBe(1);
  });

  test('flushes pending state on unmount without data loss', () => {
    const onStateChange = jest.fn();
    const initialNodes = [{ id: 'node-1', position: { x: 10, y: 20 } }];

    const { unmount } = render(
      <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
        <TestConsumer />
      </FunnelProvider>
    );

    // Move node before initial timer completes
    act(() => {
      screen.getByText('Move Node').click();
    });

    // Unmount before debounce timer finishes
    act(() => {
      unmount();
    });

    // Should flush the updated state immediately on unmount
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith({
      nodes: [{ id: 'node-1', position: { x: 100, y: 200 } }],
      edges: [],
    });
  });
});
