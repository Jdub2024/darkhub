import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onNodeUpdateCall }) => {
  const { nodes, updateNodePosition } = useFunnel();
  return (
    <div>
      <div data-testid="node-pos">
        {nodes[0].position.x},{nodes[0].position.y}
      </div>
      <button
        data-testid="move-btn"
        onClick={() => updateNodePosition('node1', 100, 200)}
      >
        Move Same
      </button>
      <button
        data-testid="move-new-btn"
        onClick={() => updateNodePosition('node1', 150, 250)}
      >
        Move New
      </button>
    </div>
  );
};

describe('FunnelProvider performance optimizations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debounces autoSync state changes by 150ms', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [{ id: 'node1', position: { x: 0, y: 0 } }];

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial mount shouldn't immediately invoke sync prior to debounce timer
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward time by 150ms
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: initialNodes,
      edges: [],
    });
  });

  it('skips state updates when node position remains unchanged (equality guard)', () => {
    const initialNodes = [{ id: 'node1', position: { x: 100, y: 200 } }];
    let renderCount = 0;

    const TrackerComponent = () => {
      const { nodes, updateNodePosition } = useFunnel();
      renderCount++;
      return (
        <button
          data-testid="move-btn"
          onClick={() => updateNodePosition('node1', 100, 200)}
        >
          Move
        </button>
      );
    };

    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TrackerComponent />
      </FunnelProvider>
    );

    const initialRenders = renderCount;

    // Trigger update with same x, y
    act(() => {
      getByTestId('move-btn').click();
    });

    // Render count should stay the same because equality guard returned prevNodes
    expect(renderCount).toBe(initialRenders);
  });
});
