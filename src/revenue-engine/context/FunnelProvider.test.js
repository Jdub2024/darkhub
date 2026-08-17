import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const initialNodes = [
  { id: 'node_1', position: { x: 10, y: 20 }, label: 'Node 1' },
  { id: 'node_2', position: { x: 50, y: 60 }, label: 'Node 2' },
];

const initialEdges = [
  { id: 'edge_1', source: 'node_1', target: 'node_2' },
];

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe('FunnelProvider performance optimizations', () => {
  it('skips state update when updateNodePosition is called with identical coordinates', () => {
    let funnelCtx;
    const TestComponent = () => {
      funnelCtx = useFunnel();
      return <div>Nodes count: {funnelCtx.nodes.length}</div>;
    };

    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestComponent />
      </FunnelProvider>
    );

    const initialNodesRef = funnelCtx.nodes;

    act(() => {
      // Call updateNodePosition with exact same position for node_1
      funnelCtx.updateNodePosition('node_1', 10, 20);
    });

    // Nodes array reference should remain strictly equal due to bailout
    expect(funnelCtx.nodes).toBe(initialNodesRef);
  });

  it('debounces onStateChange calls during rapid update events', () => {
    const handleStateChange = jest.fn();

    let funnelCtx;
    const TestComponent = () => {
      funnelCtx = useFunnel();
      return <div>Test</div>;
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

    // Clear initial mount timer if any
    act(() => {
      jest.advanceTimersByTime(150);
    });
    handleStateChange.mockClear();

    // Trigger rapid node position updates (simulating a 60fps drag sequence)
    act(() => {
      funnelCtx.updateNodePosition('node_1', 11, 20);
      funnelCtx.updateNodePosition('node_1', 12, 20);
      funnelCtx.updateNodePosition('node_1', 13, 20);
      funnelCtx.updateNodePosition('node_1', 14, 20);
    });

    // Before debounce timer fires, onStateChange should not have been called
    expect(handleStateChange).not.toHaveBeenCalled();

    // Fast-forward time by 150ms
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // onStateChange should be called exactly once with the latest state
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith({
      nodes: [
        { id: 'node_1', position: { x: 14, y: 20 }, label: 'Node 1' },
        { id: 'node_2', position: { x: 50, y: 60 }, label: 'Node 2' },
      ],
      edges: initialEdges,
    });
  });
});
