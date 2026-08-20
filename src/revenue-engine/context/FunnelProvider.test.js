import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ idToMove, newX, newY }) => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
      <span data-testid="node-pos">
        {nodes[0] ? `${nodes[0].position.x},${nodes[0].position.y}` : ''}
      </span>
      <button
        data-testid="move-btn"
        onClick={() => updateNodePosition(idToMove, newX, newY)}
      >
        Move
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

  const initialNodes = [
    { id: 'node_1', position: { x: 10, y: 20 }, label: 'Node 1' },
  ];

  test('debounces autoSync onStateChange updates', () => {
    const handleStateChange = jest.fn();

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestComponent idToMove="node_1" newX={100} newY={200} />
      </FunnelProvider>
    );

    // Initial sync fires after debounce
    expect(handleStateChange).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    handleStateChange.mockClear();

    // Trigger multiple rapid moves
    const btn = document.querySelector('[data-testid="move-btn"]');
    act(() => {
      fireEvent.click(btn);
    });

    // Advance 50ms (not yet reached 150ms)
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance remaining 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);
  });

  test('bails out of updateNodePosition when coordinates are unchanged', () => {
    const handleStateChange = jest.fn();

    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestComponent idToMove="node_1" newX={10} newY={20} />
      </FunnelProvider>
    );

    // Clear initial sync
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    const btn = getByTestId('move-btn');

    // Click with same coordinates (10, 20)
    act(() => {
      fireEvent.click(btn);
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // State hasn't changed, so no new sync triggered
    expect(handleStateChange).not.toHaveBeenCalled();
  });
});
