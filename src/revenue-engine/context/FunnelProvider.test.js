import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// A test component that consumes the FunnelContext
const TestConsumer = ({ idToUpdate, nextX, nextY }) => {
  const { nodes, updateNodePosition } = useFunnel();

  return (
    <div>
      <div data-testid="nodes-json">{JSON.stringify(nodes)}</div>
      <button
        data-testid="update-btn"
        onClick={() => updateNodePosition(idToUpdate, nextX, nextY)}
      >
        Update Position
      </button>
    </div>
  );
};

describe('FunnelProvider', () => {
  const initialNodes = [
    {
      id: 'node_1',
      type: 'traffic',
      label: 'Traffic Source',
      position: { x: 10, y: 20 },
      metrics: { volume: '10k' },
    },
  ];
  const initialEdges = [];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces state synchronization via onStateChange callback', () => {
    const onStateChangeMock = jest.fn();

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={onStateChangeMock}
        autoSync={true}
      >
        <TestConsumer idToUpdate="node_1" nextX={50} nextY={100} />
      </FunnelProvider>
    );

    // Testing Pattern: Let the initial mount timer resolve (150ms debounce) and clear the mock function
    // before performing action-based assertions to prevent the mount synchronization from bleeding into interactive tests.
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);
    onStateChangeMock.mockClear();

    // Trigger multiple high-frequency updates (simulating dragging)
    const btn = screen.getByTestId('update-btn');

    act(() => {
      fireEvent.click(btn);
    });

    // The synchronization shouldn't have been called immediately
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Advance by 100ms (less than 150ms debounce limit)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onStateChangeMock).not.toHaveBeenCalled();

    // Perform another update within the debounce window
    act(() => {
      fireEvent.click(btn);
    });

    // Advance past the remaining debounce time (another 150ms)
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // It should have been called exactly once because of debouncing/batching
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);
    expect(onStateChangeMock).toHaveBeenCalledWith({
      nodes: [{ ...initialNodes[0], position: { x: 50, y: 100 } }],
      edges: initialEdges,
    });
  });

  test('bails out of state updates if node position coordinate has not changed', () => {
    const onStateChangeMock = jest.fn();

    // We render the component with the exact same target coordinates as initial coordinates
    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={onStateChangeMock}
        autoSync={true}
      >
        <TestConsumer idToUpdate="node_1" nextX={10} nextY={20} />
      </FunnelProvider>
    );

    // Resolve initial mount timer and clear mock
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChangeMock).toHaveBeenCalledTimes(1);
    onStateChangeMock.mockClear();

    // Grab the current state content
    const nodesJsonElement = screen.getByTestId('nodes-json');
    const initialNodesJson = nodesJsonElement.textContent;

    // Trigger update with the exact same coordinates
    const btn = screen.getByTestId('update-btn');
    act(() => {
      fireEvent.click(btn);
    });

    // Since the coordinates are the same, state shouldn't change and nodes shouldn't be re-serialized or modified
    expect(nodesJsonElement.textContent).toBe(initialNodesJson);

    // Fast-forward timers, no state update or synching should occur because update was bailed out
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onStateChangeMock).not.toHaveBeenCalled();
  });
});
