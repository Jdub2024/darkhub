import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const initialNodes = [
  {
    id: 'node_trf_001',
    type: 'traffic',
    label: 'Paid Meta Framework',
    position: { x: 60, y: 120 },
    metrics: { volume: '24k', cpc: '$0.38' },
  },
];

const initialEdges = [
  { id: 'edge_001', source: 'node_trf_001', target: 'node_lnd_001', isActive: true },
];

describe('FunnelProvider Performance and Behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should update node position and trigger debounced onStateChange after 150ms', () => {
    const handleStateChange = jest.fn();

    const TestComponent = () => {
      const { updateNodePosition } = useFunnel();
      return (
        <button
          data-testid="drag-btn"
          onClick={() => updateNodePosition('node_trf_001', 100, 200)}
        >
          Drag Node
        </button>
      );
    };

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <TestComponent />
      </FunnelProvider>
    );

    // Initial render might trigger a debounced mount sync, let's advance time to clear it
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger position update
    fireEvent.click(screen.getByTestId('drag-btn'));

    // Verify onStateChange has not been called immediately
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance time by 150ms
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Verify onStateChange has been called with the updated position
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        {
          id: 'node_trf_001',
          type: 'traffic',
          label: 'Paid Meta Framework',
          position: { x: 100, y: 200 },
          metrics: { volume: '24k', cpc: '$0.38' },
        },
      ],
      edges: initialEdges,
    });
  });

  test('should debounce high-frequency updates and trigger onStateChange only once', () => {
    const handleStateChange = jest.fn();

    const HighFrequencyComponent = () => {
      const { updateNodePosition } = useFunnel();
      return (
        <button
          data-testid="drag-btn"
          onClick={() => {
            // Simulate dragging with multiple high-frequency position updates
            updateNodePosition('node_trf_001', 61, 121);
            updateNodePosition('node_trf_001', 62, 122);
            updateNodePosition('node_trf_001', 63, 123);
          }}
        >
          Drag High Frequency
        </button>
      );
    };

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onStateChange={handleStateChange}
        autoSync={true}
      >
        <HighFrequencyComponent />
      </FunnelProvider>
    );

    // Clear initial mount synchronization
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger drag
    fireEvent.click(screen.getByTestId('drag-btn'));

    // Advance halfway, shouldn't trigger
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance the remaining time to complete the 150ms debounce window
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // onStateChange should be called exactly once with the final position
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        {
          id: 'node_trf_001',
          type: 'traffic',
          label: 'Paid Meta Framework',
          position: { x: 63, y: 123 },
          metrics: { volume: '24k', cpc: '$0.38' },
        },
      ],
      edges: initialEdges,
    });
  });

  test('should bail out of state updates (retain exact nodes reference) if position coordinates are identical', () => {
    let lastNodesRef = null;

    const TestRefComponent = () => {
      const { nodes, updateNodePosition } = useFunnel();
      lastNodesRef = nodes;
      return (
        <button
          data-testid="same-pos-btn"
          onClick={() => updateNodePosition('node_trf_001', 60, 120)}
        >
          Same Position
        </button>
      );
    };

    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestRefComponent />
      </FunnelProvider>
    );

    const firstRef = lastNodesRef;
    expect(firstRef).not.toBeNull();

    // Trigger update with same position coordinates (60, 120)
    fireEvent.click(screen.getByTestId('same-pos-btn'));

    const secondRef = lastNodesRef;
    // Verify that the array reference is identical, indicating a complete state update bail-out!
    expect(firstRef).toBe(secondRef);
  });
});
