import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ id, nextX, nextY, triggerUpdate }) => {
  const { updateNodePosition } = useFunnel();

  React.useEffect(() => {
    if (triggerUpdate) {
      updateNodePosition(id, nextX, nextY);
    }
  }, [triggerUpdate, id, nextX, nextY, updateNodePosition]);

  return null;
};

describe('FunnelProvider Performance', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces onStateChange calls', () => {
    const onStateChange = jest.fn();
    const initialNodes = [{ id: '1', position: { x: 0, y: 0 } }];

    const { rerender } = render(
      <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
        <TestComponent />
      </FunnelProvider>
    );

    // Initial mount triggers useEffect, which starts a timer
    expect(onStateChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Rapid updates
    act(() => {
      rerender(
        <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
          <TestComponent id="1" nextX={10} nextY={10} triggerUpdate={true} />
        </FunnelProvider>
      );
    });

    act(() => {
      rerender(
        <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
          <TestComponent id="1" nextX={20} nextY={20} triggerUpdate={true} />
        </FunnelProvider>
      );
    });

    // Should not have been called yet because of debounce
    expect(onStateChange).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should have been called exactly once more after the delay
    expect(onStateChange).toHaveBeenCalledTimes(2);
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      nodes: expect.arrayContaining([
        expect.objectContaining({ position: { x: 20, y: 20 } })
      ])
    }));
  });
});
