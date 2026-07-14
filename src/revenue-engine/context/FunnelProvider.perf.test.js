import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onRender }) => {
  const { updateNodePosition } = useFunnel();
  React.useEffect(() => {
    onRender(updateNodePosition);
  }, [onRender, updateNodePosition]);
  return null;
};

describe('FunnelProvider Performance', () => {
  test('onStateChange should be debounced', () => {
    jest.useFakeTimers();
    const onStateChange = jest.fn();
    let updateNode;

    render(
      <FunnelProvider
        initialNodes={[{ id: '1', position: { x: 0, y: 0 }, type: 'traffic', label: 'Test', metrics: {} }]}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <TestComponent onRender={(fn) => { updateNode = fn; }} />
      </FunnelProvider>
    );

    // Initial effect might run immediately or in next tick depending on React 18 scheduling
    // But it's inside a setTimeout(..., 150)
    expect(onStateChange).not.toHaveBeenCalled();

    // Advance to trigger initial mount sync
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChange).toHaveBeenCalledTimes(1);

    // Simulate high-frequency updates (e.g. dragging)
    act(() => {
      updateNode('1', 1, 1);
      updateNode('1', 2, 2);
      updateNode('1', 3, 3);
    });

    // Should NOT have been called again yet due to debounce
    expect(onStateChange).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // After debounce period, it should have been called exactly once more
    expect(onStateChange).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  test('updateNodePosition should bail out if coordinates are identical', () => {
    const onStateChange = jest.fn();
    let updateNode;
    let renderCount = 0;

    const Consumer = () => {
      const { nodes } = useFunnel();
      renderCount++;
      return <div>{nodes[0].position.x}</div>;
    };

    render(
      <FunnelProvider
        initialNodes={[{ id: '1', position: { x: 0, y: 0 }, type: 'traffic', label: 'Test', metrics: {} }]}
        onStateChange={onStateChange}
        autoSync={true}
      >
        <Consumer />
        <TestComponent onRender={(fn) => { updateNode = fn; }} />
      </FunnelProvider>
    );

    const initialRenders = renderCount;

    act(() => {
      updateNode('1', 0, 0); // Same coordinates
      updateNode('1', 0, 0); // Same coordinates
    });

    // Render count should NOT increase because of the bail-out
    expect(renderCount).toBe(initialRenders);
  });
});
