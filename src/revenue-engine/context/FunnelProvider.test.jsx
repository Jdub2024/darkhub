import React from 'react';
import { render, act, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onRenderCount }) => {
  const { nodes, updateNodePosition } = useFunnel();
  if (onRenderCount) onRenderCount();

  return (
    <div>
      <div data-testid="node-pos">
        {nodes[0] ? `${nodes[0].position.x},${nodes[0].position.y}` : ''}
      </div>
      <button
        data-testid="move-btn"
        onClick={() => updateNodePosition('n1', 100, 200)}
      >
        Move
      </button>
      <button
        data-testid="same-pos-btn"
        onClick={() => updateNodePosition('n1', 10, 20)}
      >
        Same Pos
      </button>
      <button
        data-testid="non-existent-btn"
        onClick={() => updateNodePosition('nonexistent', 99, 99)}
      >
        Move Missing
      </button>
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

  test('updates node position correctly', () => {
    const initialNodes = [
      { id: 'n1', position: { x: 10, y: 20 } },
    ];

    render(
      <FunnelProvider initialNodes={initialNodes} autoSync={false}>
        <TestComponent />
      </FunnelProvider>
    );

    expect(screen.getByTestId('node-pos')).toHaveTextContent('10,20');

    fireEvent.click(screen.getByTestId('move-btn'));

    expect(screen.getByTestId('node-pos')).toHaveTextContent('100,200');
  });

  test('equality guard skips re-render when position coordinates are identical', () => {
    let renderCount = 0;
    const initialNodes = [
      { id: 'n1', position: { x: 10, y: 20 } },
    ];

    render(
      <FunnelProvider initialNodes={initialNodes} autoSync={false}>
        <TestComponent onRenderCount={() => { renderCount += 1; }} />
      </FunnelProvider>
    );

    const initialRenders = renderCount;

    // Moving with same coordinates (10, 20)
    fireEvent.click(screen.getByTestId('same-pos-btn'));
    expect(renderCount).toBe(initialRenders);

    // Moving missing node id
    fireEvent.click(screen.getByTestId('non-existent-btn'));
    expect(renderCount).toBe(initialRenders);
  });

  test('debounces onStateChange when autoSync is true', () => {
    const onStateChange = jest.fn();
    const initialNodes = [
      { id: 'n1', position: { x: 10, y: 20 } },
    ];

    render(
      <FunnelProvider initialNodes={initialNodes} autoSync={true} onStateChange={onStateChange}>
        <TestComponent />
      </FunnelProvider>
    );

    // On initial mount, debounce timer starts
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance 50ms (less than 150ms debounce)
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Complete initial debounce
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        nodes: [{ id: 'n1', position: { x: 10, y: 20 } }],
      })
    );

    onStateChange.mockClear();

    // Simulate rapid drag events (e.g. 5 moves within 100ms)
    act(() => {
      fireEvent.click(screen.getByTestId('move-btn'));
    });
    act(() => {
      jest.advanceTimersByTime(30);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Another update before 150ms timer resolves
    act(() => {
      // Advance by another 30ms
      jest.advanceTimersByTime(30);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance beyond 150ms debounce threshold
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        nodes: [{ id: 'n1', position: { x: 100, y: 200 } }],
      })
    );
  });

  test('flushes pending state synchronization on unmount', () => {
    const onStateChange = jest.fn();
    const initialNodes = [
      { id: 'n1', position: { x: 10, y: 20 } },
    ];

    const { unmount } = render(
      <FunnelProvider initialNodes={initialNodes} autoSync={true} onStateChange={onStateChange}>
        <TestComponent />
      </FunnelProvider>
    );

    // Flush initial mount debounce
    act(() => {
      jest.advanceTimersByTime(150);
    });
    onStateChange.mockClear();

    // Trigger update
    act(() => {
      fireEvent.click(screen.getByTestId('move-btn'));
    });

    // Unmount before 150ms timer finishes
    expect(onStateChange).not.toHaveBeenCalled();
    unmount();

    // Unmount should have flushed pending state synchronously
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        nodes: [{ id: 'n1', position: { x: 100, y: 200 } }],
      })
    );
  });
});
