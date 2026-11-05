import React from 'react';
import { render, act, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

const TestConsumer = ({ onRender }) => {
  const { nodes, updateNodePosition } = useFunnel();
  if (onRender) onRender(nodes);

  return (
    <div>
      <div data-testid="nodes-count">{nodes.length}</div>
      <div data-testid="node-0-pos">
        {nodes[0] ? `${nodes[0].position.x},${nodes[0].position.y}` : 'none'}
      </div>
      <button
        data-testid="move-btn"
        onClick={() => updateNodePosition('node_1', 100, 200)}
      >
        Move
      </button>
      <button
        data-testid="move-same-btn"
        onClick={() => updateNodePosition('node_1', 10, 20)}
      >
        Move Same
      </button>
      <button
        data-testid="move-nonexistent-btn"
        onClick={() => updateNodePosition('nonexistent', 500, 500)}
      >
        Move Nonexistent
      </button>
    </div>
  );
};

describe('FunnelProvider optimizations', () => {
  test('equality guard bails out of re-rendering when position is unchanged or node not found', () => {
    const initialNodes = [
      { id: 'node_1', position: { x: 10, y: 20 } },
    ];
    let renderCount = 0;
    const handleRender = () => {
      renderCount++;
    };

    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestConsumer onRender={handleRender} />
      </FunnelProvider>
    );

    expect(renderCount).toBe(1);

    // Click to update to identical coordinates
    fireEvent.click(screen.getByTestId('move-same-btn'));
    expect(renderCount).toBe(1);

    // Click to update nonexistent node
    fireEvent.click(screen.getByTestId('move-nonexistent-btn'));
    expect(renderCount).toBe(1);

    // Click to update with different coordinates
    fireEvent.click(screen.getByTestId('move-btn'));
    expect(renderCount).toBe(2);
    expect(screen.getByTestId('node-0-pos')).toHaveTextContent('100,200');
  });

  test('debounces autoSync calls during rapid state updates and flushes on unmount', () => {
    jest.useFakeTimers();

    const onStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 0, y: 0 } },
    ];

    const { unmount } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={onStateChange}
      >
        <TestConsumer />
      </FunnelProvider>
    );

    // Initial mount triggers timer; let's advance past initial debounce
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    onStateChange.mockClear();

    // Rapidly trigger node moves (simulating 60fps drag events)
    act(() => {
      fireEvent.click(screen.getByTestId('move-btn'));
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance 50ms (before debounce timeout of 150ms)
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance remaining 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [expect.objectContaining({ position: { x: 100, y: 200 } })],
      })
    );

    onStateChange.mockClear();

    // Trigger update and unmount before timer expires -> should flush immediately
    act(() => {
      fireEvent.click(screen.getByTestId('move-same-btn')); // changes to 10, 20
    });
    expect(onStateChange).not.toHaveBeenCalled();

    unmount();
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [expect.objectContaining({ position: { x: 10, y: 20 } })],
      })
    );
  });
});
