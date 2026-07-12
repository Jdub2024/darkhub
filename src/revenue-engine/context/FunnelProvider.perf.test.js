import { render, act } from '@testing-library/react';
import React from 'react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Test component to consume the context
const Consumer = ({ onRender }) => {
  const { updateNodePosition } = useFunnel();
  onRender();

  return (
    <button onClick={() => updateNodePosition('node1', 100, 100)}>
      Update Position
    </button>
  );
};

describe('FunnelProvider Performance', () => {
  jest.useFakeTimers();

  it('debounces onStateChange calls during high-frequency updates', () => {
    const onStateChange = jest.fn();
    const initialNodes = [{ id: 'node1', position: { x: 0, y: 0 } }];

    const { getByText } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <Consumer onRender={() => {}} />
      </FunnelProvider>
    );

    // Initial call on mount
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Simulate high-frequency updates (e.g. dragging)
    const button = getByText('Update Position');
    for (let i = 1; i <= 10; i++) {
      act(() => {
        // We need to re-render or trigger the action that calls updateNodePosition
        // In this case, clicking the button
        button.click();
      });
    }

    // Should not have been called yet because of debounce
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should have been called exactly once more after debouncing
    expect(onStateChange).toHaveBeenCalledTimes(2);
  });

  it('bails out of state updates if position remains the same', () => {
    let renderCount = 0;
    const initialNodes = [{ id: 'node1', position: { x: 100, y: 100 } }];

    const { getByText } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <Consumer onRender={() => { renderCount++; }} />
      </FunnelProvider>
    );

    // Reset counter after initial mount render
    renderCount = 0;

    const button = getByText('Update Position');

    act(() => {
      // updateNodePosition with same coordinates (100, 100)
      button.click();
    });

    // Render count should still be 0 (or no additional renders)
    // because we returned the previous state reference
    expect(renderCount).toBe(0);
  });
});
