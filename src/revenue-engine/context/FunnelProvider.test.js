import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

describe('FunnelProvider performance optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const initialNodes = [
    { id: 'node_1', position: { x: 10, y: 20 }, label: 'Node 1' },
    { id: 'node_2', position: { x: 50, y: 60 }, label: 'Node 2' },
  ];

  const initialEdges = [{ id: 'edge_1', source: 'node_1', target: 'node_2' }];

  function TestConsumer({ onRender, testAction }) {
    const funnel = useFunnel();
    if (onRender) {
      onRender(funnel);
    }
    return (
      <div>
        <div data-testid="node-1-pos">{`${funnel.nodes[0].position.x},${funnel.nodes[0].position.y}`}</div>
        <button
          data-testid="update-btn"
          onClick={() => {
            if (testAction) testAction(funnel);
          }}
        >
          Update
        </button>
      </div>
    );
  }

  test('debounces onStateChange calls during rapid updates', () => {
    const onStateChange = jest.fn();

    const { unmount } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestConsumer
          testAction={(funnel) => {
            funnel.updateNodePosition('node_1', 11, 21);
            funnel.updateNodePosition('node_1', 12, 22);
            funnel.updateNodePosition('node_1', 13, 23);
          }}
        />
      </FunnelProvider>
    );

    // Initial mount debounce
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    onStateChange.mockClear();

    // Trigger rapid updates (e.g. simulated drag)
    const btn = screen.getByTestId('update-btn');
    act(() => {
      btn.click();
    });

    // Before timer elapses, onStateChange should not have fired yet
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // After remaining time elapses
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({
            id: 'node_1',
            position: { x: 13, y: 23 },
          }),
        ]),
      })
    );

    unmount();
  });

  test('updateNodePosition equality guard skips state update when coordinates do not change', () => {
    let renderCount = 0;
    const { unmount } = render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestConsumer
          onRender={() => {
            renderCount += 1;
          }}
          testAction={(funnel) => {
            // Update with identical coordinates
            funnel.updateNodePosition('node_1', 10, 20);
          }}
        />
      </FunnelProvider>
    );

    const initialRenderCount = renderCount;
    const btn = screen.getByTestId('update-btn');

    act(() => {
      btn.click();
    });

    // Render count should NOT increase because state update bailed out
    expect(renderCount).toBe(initialRenderCount);

    unmount();
  });

  test('updateNodePosition ignores unknown node id gracefully without re-rendering', () => {
    let renderCount = 0;
    const { unmount } = render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestConsumer
          onRender={() => {
            renderCount += 1;
          }}
          testAction={(funnel) => {
            funnel.updateNodePosition('non_existent_node', 99, 99);
          }}
        />
      </FunnelProvider>
    );

    const initialRenderCount = renderCount;
    const btn = screen.getByTestId('update-btn');

    act(() => {
      btn.click();
    });

    expect(renderCount).toBe(initialRenderCount);

    unmount();
  });
});
