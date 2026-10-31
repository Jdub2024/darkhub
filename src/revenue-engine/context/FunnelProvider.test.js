import React, { useRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

describe('FunnelProvider Performance Optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const initialNodes = [
    { id: 'node_1', position: { x: 100, y: 100 }, label: 'Test Node 1' },
    { id: 'node_2', position: { x: 300, y: 300 }, label: 'Test Node 2' },
  ];
  const initialEdges = [
    { id: 'edge_1', source: 'node_1', target: 'node_2', isActive: true },
  ];

  test('debounces onStateChange calls during rapid updates', () => {
    const handleStateChange = jest.fn();

    const Consumer = () => {
      const { updateNodePosition } = useFunnel();
      return (
        <button
          data-testid="drag-btn"
          onClick={() => {
            // Simulate 10 rapid coordinate updates (such as during dragging)
            for (let i = 1; i <= 10; i++) {
              updateNodePosition('node_1', 100 + i, 100 + i);
            }
          }}
        >
          Drag
        </button>
      );
    };

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <Consumer />
      </FunnelProvider>
    );

    // Initial mount triggers debounce timer
    expect(handleStateChange).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Trigger rapid updates
    act(() => {
      screen.getByTestId('drag-btn').click();
    });

    // Before debounce interval, callback has not fired
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance halfway (75ms)
    act(() => {
      jest.advanceTimersByTime(75);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance past remaining time to complete 150ms debounce
    act(() => {
      jest.advanceTimersByTime(75);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: 'node_1', position: { x: 110, y: 110 } }),
        ]),
      })
    );
  });

  test('flushes pending synchronization on unmount to prevent data loss', () => {
    const handleStateChange = jest.fn();

    const Consumer = () => {
      const { updateNodePosition } = useFunnel();
      return (
        <button
          data-testid="drag-btn"
          onClick={() => updateNodePosition('node_1', 500, 500)}
        >
          Move
        </button>
      );
    };

    const { unmount } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <Consumer />
      </FunnelProvider>
    );

    // Let initial mount debounce complete
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger update but do NOT advance timers
    act(() => {
      screen.getByTestId('drag-btn').click();
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Unmount before timer finishes
    unmount();

    // Should flush the pending change synchronously on unmount
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: 'node_1', position: { x: 500, y: 500 } }),
        ]),
      })
    );
  });

  test('skips state updates and prevents unnecessary re-renders when coordinates are identical', () => {
    const renderCounter = jest.fn();

    const Consumer = () => {
      const { nodes, updateNodePosition } = useFunnel();
      const renderCount = useRef(0);
      renderCount.current += 1;
      renderCounter(renderCount.current);

      return (
        <div>
          <span data-testid="pos-x">{nodes[0].position.x}</span>
          <button
            data-testid="same-pos-btn"
            onClick={() => updateNodePosition('node_1', 100, 100)}
          >
            Same Pos
          </button>
          <button
            data-testid="nonexistent-btn"
            onClick={() => updateNodePosition('nonexistent_id', 999, 999)}
          >
            Nonexistent Node
          </button>
        </div>
      );
    };

    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <Consumer />
      </FunnelProvider>
    );

    const initialRenderCount = renderCounter.mock.calls.length;

    // Dispatching position update with identical coordinates should bail out
    act(() => {
      screen.getByTestId('same-pos-btn').click();
    });
    expect(renderCounter).toHaveBeenCalledTimes(initialRenderCount);

    // Dispatching update for non-existent node should also bail out
    act(() => {
      screen.getByTestId('nonexistent-btn').click();
    });
    expect(renderCounter).toHaveBeenCalledTimes(initialRenderCount);
  });
});
