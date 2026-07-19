import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

jest.useFakeTimers();

const TestComponent = ({ onNodeUpdate }) => {
  const { updateNodePosition } = useFunnel();
  // Expose the function so we can invoke it from the test
  React.useEffect(() => {
    if (onNodeUpdate) {
      onNodeUpdate(updateNodePosition);
    }
  }, [updateNodePosition, onNodeUpdate]);
  return <div>Test</div>;
};

describe('FunnelProvider Optimization Tests', () => {
  const initialNodes = [
    { id: '1', position: { x: 10, y: 20 }, metrics: {} },
  ];

  test('debounces onStateChange callback and groups high-frequency updates', () => {
    const onStateChange = jest.fn();
    let triggerUpdate;

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestComponent onNodeUpdate={(fn) => { triggerUpdate = fn; }} />
      </FunnelProvider>
    );

    // Initial mount might trigger the first debounce cycle, clear timers first
    act(() => {
      jest.advanceTimersByTime(150);
    });
    onStateChange.mockClear();

    // High frequency position updates (e.g. dragging at 60fps)
    act(() => {
      triggerUpdate('1', 11, 21);
      triggerUpdate('1', 12, 22);
      triggerUpdate('1', 13, 23);
    });

    // Verify it is not called immediately due to debouncing
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance timers partially (less than 150ms)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance remaining time
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Assert it was only called once after the debounce interval
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [{ id: '1', position: { x: 13, y: 23 }, metrics: {} }],
      })
    );
  });

  test('equality guard skips state updates when coordinates are unchanged', () => {
    const onStateChange = jest.fn();
    let triggerUpdate;

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestComponent onNodeUpdate={(fn) => { triggerUpdate = fn; }} />
      </FunnelProvider>
    );

    act(() => {
      jest.advanceTimersByTime(150);
    });
    onStateChange.mockClear();

    // Trigger update with the same coordinates
    act(() => {
      triggerUpdate('1', 10, 20);
    });

    // Advance timers to trigger potential debounced state synchronization
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // It should not sync because the position was identical, meaning state was unchanged (bailing out)
    expect(onStateChange).not.toHaveBeenCalled();
  });
});
