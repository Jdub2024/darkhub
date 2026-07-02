import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ id, nextX, nextY }) => {
  const { updateNodePosition } = useFunnel();
  return (
    <button onClick={() => updateNodePosition(id, nextX, nextY)}>
      Update
    </button>
  );
};

describe('FunnelProvider Performance', () => {
  jest.useFakeTimers();

  it('should debounce onStateChange calls', () => {
    const onStateChange = jest.fn();
    const initialNodes = [{ id: '1', position: { x: 0, y: 0 } }];

    const { getByText } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestComponent id="1" nextX={10} nextY={10} />
      </FunnelProvider>
    );

    const button = getByText('Update');

    // Trigger multiple updates rapidly
    act(() => {
      button.click();
      button.click();
      button.click();
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // It should have been called now
    expect(onStateChange).toHaveBeenCalled();
  });

  it('should not update state if position is the same', () => {
    let renderCount = 0;
    const ConsumerMonitor = () => {
      useFunnel(); // Subscribe to context
      renderCount++;
      return null;
    };

    const initialNodes = [{ id: '1', position: { x: 10, y: 10 } }];

    const { getByText } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <ConsumerMonitor />
        <TestComponent id="1" nextX={10} nextY={10} />
      </FunnelProvider>
    );

    const button = getByText('Update');
    const initialRenders = renderCount;

    act(() => {
      button.click();
    });

    // Should not trigger a re-render of consumer if position is the same
    // and state bail-out occurred.
    expect(renderCount).toBe(initialRenders);
  });
});
