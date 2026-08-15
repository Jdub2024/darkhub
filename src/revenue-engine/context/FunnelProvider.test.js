import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onNodeUpdate }) => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
      <div data-testid="node-x">{nodes[0]?.position.x}</div>
      <button
        data-testid="update-btn"
        onClick={() => {
          updateNodePosition('node_1', 100, 200);
          if (onNodeUpdate) onNodeUpdate();
        }}
      >
        Update Node
      </button>
      <button
        data-testid="same-update-btn"
        onClick={() => {
          updateNodePosition('node_1', 100, 200);
        }}
      >
        Same Update Node
      </button>
    </div>
  );
};

describe('FunnelProvider performance optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces onStateChange callback', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 0, y: 0 }, type: 'traffic', label: 'Node 1', metrics: {} }
    ];

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial mount triggers timer; resolve it and clear initial call
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger update
    const button = document.querySelector('[data-testid="update-btn"]');
    act(() => {
      button.click();
    });

    // Callback should not be called immediately due to debouncing
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward time past debounce threshold
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({
            id: 'node_1',
            position: { x: 100, y: 200 }
          })
        ])
      })
    );
  });

  test('updateNodePosition bails out if coordinates are unchanged', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 100, y: 200 }, type: 'traffic', label: 'Node 1', metrics: {} }
    ];

    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestComponent />
      </FunnelProvider>
    );

    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    const sameBtn = getByTestId('same-update-btn');

    // Clicking with same coordinates should not trigger state change timer or callback
    act(() => {
      sameBtn.click();
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(handleStateChange).not.toHaveBeenCalled();
  });
});
