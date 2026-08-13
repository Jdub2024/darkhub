import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onRender }) => {
  const { nodes, updateNodePosition } = useFunnel();
  onRender(nodes);
  return (
    <div>
      {nodes.map((node) => (
        <button
          key={node.id}
          data-testid={node.id}
          onClick={() => updateNodePosition(node.id, node.position.x + 10, node.position.y + 10)}
        >
          {node.label}
        </button>
      ))}
      <button
        data-testid="no-op-btn"
        onClick={() => updateNodePosition('node_1', 100, 100)}
      >
        No Op
      </button>
    </div>
  );
};

describe('FunnelProvider Performance Optimization Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanup();
  });

  test('debounces state synchronization callback during high-frequency updates', () => {
    const mockOnStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 100, y: 100 }, label: 'Node 1' },
    ];

    const { unmount } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={mockOnStateChange}
        autoSync={true}
      >
        <TestComponent onRender={() => {}} />
      </FunnelProvider>
    );

    // Initial mount triggers the sync callback. Let's advance timers and clear mock.
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    mockOnStateChange.mockClear();

    // Unmount before starting the second phase of the test to avoid duplicate nodes in DOM
    unmount();

    // Now, simulate a high frequency drag (multiple state updates)
    const renderSpy = jest.fn();
    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={mockOnStateChange}
        autoSync={true}
      >
        <TestComponent onRender={renderSpy} />
      </FunnelProvider>
    );

    // Clear initial mount timer & callback mock for the second render
    act(() => {
      jest.advanceTimersByTime(150);
    });
    mockOnStateChange.mockClear();

    const nodeBtn = getByTestId('node_1');

    // Trigger high-frequency position updates
    act(() => {
      nodeBtn.click(); // x: 110, y: 110
    });
    act(() => {
      nodeBtn.click(); // x: 120, y: 120
    });
    act(() => {
      nodeBtn.click(); // x: 130, y: 130
    });

    // Verify that the callback hasn't been called immediately
    expect(mockOnStateChange).not.toHaveBeenCalled();

    // Advance time partly
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(mockOnStateChange).not.toHaveBeenCalled();

    // Advance to complete 150ms debounce
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Should only have been called once instead of 3 times
    expect(mockOnStateChange).toHaveBeenCalledTimes(1);
    expect(mockOnStateChange).toHaveBeenCalledWith({
      nodes: [{ id: 'node_1', position: { x: 130, y: 130 }, label: 'Node 1' }],
      edges: [],
    });
  });

  test('bails out of state updates if position does not change', () => {
    const mockOnStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', position: { x: 100, y: 100 }, label: 'Node 1' },
    ];

    const renderSpy = jest.fn();

    const { getByTestId } = render(
      <FunnelProvider
        initialNodes={initialNodes}
        onStateChange={mockOnStateChange}
        autoSync={true}
      >
        <TestComponent onRender={renderSpy} />
      </FunnelProvider>
    );

    // Initial render count = 1.
    // Let's resolve the initial mount autoSync.
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Clear the rendering spy tracking
    renderSpy.mockClear();

    const noOpBtn = getByTestId('no-op-btn');

    // Action: click node update but coordinates are identical (100, 100)
    act(() => {
      noOpBtn.click();
    });

    // Because the state bailed out, the component should not re-render
    expect(renderSpy).not.toHaveBeenCalled();
  });
});
