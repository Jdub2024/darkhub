import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onStateChange, updateCoords }) => {
  const { nodes, updateNodePosition } = useFunnel();

  React.useEffect(() => {
    if (updateCoords) {
      updateCoords.current = (id, x, y) => {
        updateNodePosition(id, x, y);
      };
    }
  }, [updateNodePosition, updateCoords]);

  return (
    <div>
      {nodes.map((node) => (
        <span key={node.id} data-testid={node.id}>
          {node.position.x},{node.position.y}
        </span>
      ))}
    </div>
  );
};

describe('FunnelProvider', () => {
  const initialNodes = [
    { id: 'node_1', position: { x: 10, y: 20 }, label: 'Node 1', metrics: {}, type: 'traffic' }
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('correctly updates node coordinates', () => {
    const updateCoords = { current: null };
    const { getByTestId } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent updateCoords={updateCoords} />
      </FunnelProvider>
    );

    expect(getByTestId('node_1').textContent).toBe('10,20');

    act(() => {
      updateCoords.current('node_1', 15, 25);
    });

    expect(getByTestId('node_1').textContent).toBe('15,25');
  });

  test('bails out of state updates if coordinates have not changed', () => {
    let renderCount = 0;
    const TrackerComponent = () => {
      const { updateNodePosition } = useFunnel();
      renderCount++;
      return (
        <button onClick={() => updateNodePosition('node_1', 10, 20)}>
          Update Same Coords
        </button>
      );
    };

    const { getByText } = render(
      <FunnelProvider initialNodes={initialNodes}>
        <TrackerComponent />
      </FunnelProvider>
    );

    // Initial render count is 1
    expect(renderCount).toBe(1);

    act(() => {
      getByText('Update Same Coords').click();
    });

    // Should still be 1 because coordinates didn't change (strict reference / state bailout)
    expect(renderCount).toBe(1);
  });

  test('debounces state change synchronization callback', () => {
    const onStateChange = jest.fn();
    const updateCoords = { current: null };

    render(
      <FunnelProvider initialNodes={initialNodes} onStateChange={onStateChange} autoSync={true}>
        <TestComponent updateCoords={updateCoords} />
      </FunnelProvider>
    );

    // Initial run triggers no-op immediately unless timer runs
    expect(onStateChange).not.toHaveBeenCalled();

    // Perform high frequency position updates (like dragging)
    act(() => {
      updateCoords.current('node_1', 11, 21);
    });
    act(() => {
      updateCoords.current('node_1', 12, 22);
    });
    act(() => {
      updateCoords.current('node_1', 13, 23);
    });

    // Still shouldn't have called onStateChange
    expect(onStateChange).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should only be called once with final coordinates
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith({
      nodes: [
        expect.objectContaining({
          id: 'node_1',
          position: { x: 13, y: 23 },
        }),
      ],
      edges: [],
    });
  });
});
