import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useEffect } from 'react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

// Helper component to check the debounced update state behavior
const TestFunnelComponent = ({ onStateChange, autoSync }) => {
  const { nodes, updateNodePosition } = useFunnel();

  useEffect(() => {
    // Simulate updating node position repeatedly at high frequency
    updateNodePosition('node_1', 10, 10);
    updateNodePosition('node_1', 20, 20);
    updateNodePosition('node_1', 30, 30);
  }, [updateNodePosition]);

  return (
    <div>
      {nodes.map(n => (
        <div key={n.id} data-testid={`node-${n.id}`}>
          {n.position.x},{n.position.y}
        </div>
      ))}
    </div>
  );
};

describe('FunnelProvider Performance Optimization Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces state updates on onStateChange and reduces callback frequency', () => {
    const handleStateChange = jest.fn();
    const initialNodes = [
      { id: 'node_1', type: 'traffic', label: 'Node 1', position: { x: 0, y: 0 }, metrics: {} }
    ];

    render(
      <FunnelProvider
        initialNodes={initialNodes}
        autoSync={true}
        onStateChange={handleStateChange}
      >
        <TestFunnelComponent />
      </FunnelProvider>
    );

    // After mounting and updating high-frequency moves, check that the sync callback was not called immediately
    expect(handleStateChange).not.toHaveBeenCalled();

    // Advance timers past the 150ms debounce window
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // It should have been called exactly once with the final, batched state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith(expect.objectContaining({
      nodes: [
        expect.objectContaining({
          id: 'node_1',
          position: { x: 30, y: 30 }
        })
      ]
    }));
  });
});
