import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

jest.useFakeTimers();

// Helper component to interact with FunnelProvider
const TestComponent = () => {
  const { updateNodePosition } = useFunnel();
  return (
    <button onClick={() => updateNodePosition('node_1', 100, 200)}>
      Move Node
    </button>
  );
};

describe('FunnelProvider Sync and Debouncing', () => {
  it('debounces state synchronization updates and bails out if position does not change', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 0, y: 0 } }
    ];

    const { getByText } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial render should schedule sync, but not fire yet since it is debounced
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward time to trigger the initial sync
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);

    // Trigger high-frequency updates (like rapid dragging)
    const button = getByText('Move Node');
    act(() => {
      button.click();
    });
    act(() => {
      button.click();
    });
    act(() => {
      button.click();
    });

    // High frequency clicks should not have triggered handleStateChange yet because of debounce
    expect(handleStateChange).toHaveBeenCalledTimes(1);

    // Advance timers partially - still no callback
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(1);

    // Advance full debounce time to trigger sync
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(handleStateChange).toHaveBeenCalledTimes(2);

    // Try moving to the exact same position - should bail out and not trigger state change
    act(() => {
      button.click();
    });
    act(() => {
      jest.advanceTimersByTime(150);
    });
    // Call count should still be 2 due to bailout!
    expect(handleStateChange).toHaveBeenCalledTimes(2);
  });
});
