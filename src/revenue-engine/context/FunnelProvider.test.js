import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const initialNodes = [
  { id: 'node_1', type: 'traffic', label: 'Node 1', position: { x: 10, y: 20 }, metrics: {} }
];

describe('FunnelProvider Performance and Behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('bails out of state updates (avoids re-rendering) when position coordinates are identical', () => {
    let renderCount = 0;
    const TestComponent = () => {
      renderCount++;
      const { updateNodePosition } = useFunnel();
      return (
        <button
          data-testid="btn-update-same"
          onClick={() => updateNodePosition('node_1', 10, 20)}
        >
          Update Same
        </button>
      );
    };

    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent />
      </FunnelProvider>
    );

    // Initial render
    expect(renderCount).toBe(1);

    // Trigger update with same values
    fireEvent.click(getByTestId('btn-update-same'));

    // React should bail out and not re-render
    expect(renderCount).toBe(1);
  });

  test('debounces autoSync onStateChange notifications to 150ms during high-frequency updates', () => {
    const onStateChange = jest.fn();

    const TestComponent = () => {
      const { updateNodePosition } = useFunnel();
      return (
        <button
          data-testid="btn-update-diff"
          onClick={() => {
            updateNodePosition('node_1', 30, 40);
          }}
        >
          Update Diff
        </button>
      );
    };

    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
        <TestComponent />
      </FunnelProvider>
    );

    // Check that it's not called immediately
    expect(onStateChange).not.toHaveBeenCalled();

    // Fast-forward 150ms to clear the initial mount sync
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
    onStateChange.mockClear();

    // Now, trigger state updates rapidly (high-frequency dragging simulated)
    fireEvent.click(getByTestId('btn-update-diff'));

    // Check that it's not called immediately
    expect(onStateChange).not.toHaveBeenCalled();

    // Fast-forward partially
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Trigger another update before the first 150ms has passed
    // To do this, we need to make sure the coordinates are different so a state update occurs
    let coords = { x: 30, y: 40 };
    const TestComponentDynamic = () => {
      const { updateNodePosition } = useFunnel();
      return (
        <button
          data-testid="btn-update-dynamic"
          onClick={() => {
            updateNodePosition('node_1', coords.x, coords.y);
          }}
        >
          Update Dynamic
        </button>
      );
    };

    const { getByTestId: getByTestIdDynamic } = render(
      <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
        <TestComponentDynamic />
      </FunnelProvider>
    );

    // Let's handle the initial mount sync for the second provider
    act(() => {
      jest.advanceTimersByTime(150);
    });
    onStateChange.mockClear();

    // Start drag updates
    coords = { x: 50, y: 60 };
    fireEvent.click(getByTestIdDynamic('btn-update-dynamic'));

    // Advance 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Mid-drag update
    coords = { x: 70, y: 80 };
    fireEvent.click(getByTestIdDynamic('btn-update-dynamic'));

    // Advance another 100ms (total 200ms from start, but only 100ms from second update)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Now advance another 50ms (total 150ms from last update)
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);
  });
});
