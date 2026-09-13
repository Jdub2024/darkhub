import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onNodeUpdate }) => {
  const { updateNodePosition } = useFunnel();
  return (
    <button
      onClick={() => {
        updateNodePosition('node_1', 100, 200);
        if (onNodeUpdate) onNodeUpdate();
      }}
    >
      Update Position
    </button>
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

  test('debounces autoSync state synchronization callbacks', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 0, y: 0 } },
    ];

    const { getByText } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial mount triggers timer; let's flush mount timer and reset mock
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    const button = getByText('Update Position');

    // Trigger multiple high-frequency node updates (e.g., simulating drag)
    act(() => {
      button.click();
      button.click();
      button.click();
    });

    // Callback should not have been called immediately due to debouncing
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance time by 100ms (less than 150ms debounce threshold)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance time to pass the 150ms debounce threshold
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Callback should be executed exactly once with the latest state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [{ id: 'node_1', position: { x: 100, y: 200 } }],
      edges: [],
    });
  });
});
