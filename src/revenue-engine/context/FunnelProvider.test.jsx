import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const sampleNodes = [
  { id: 'n1', position: { x: 10, y: 20 }, label: 'Node 1' },
  { id: 'n2', position: { x: 30, y: 40 }, label: 'Node 2' },
];

describe('FunnelProvider - updateNodePosition bail-out', () => {
  test('does not update state reference when node position is unchanged', () => {
    let funnelContext;

    function TestComponent() {
      funnelContext = useFunnel();
      return null;
    }

    render(
      <FunnelProvider initialNodes={sampleNodes}>
        <TestComponent />
      </FunnelProvider>
    );

    const initialNodesRef = funnelContext.nodes;

    // Call updateNodePosition with exact same position coordinates
    act(() => {
      funnelContext.updateNodePosition('n1', 10, 20);
    });

    // Reference should be strictly equal because state update bailed out
    expect(funnelContext.nodes).toBe(initialNodesRef);
  });

  test('does not update state reference when node id does not exist', () => {
    let funnelContext;

    function TestComponent() {
      funnelContext = useFunnel();
      return null;
    }

    render(
      <FunnelProvider initialNodes={sampleNodes}>
        <TestComponent />
      </FunnelProvider>
    );

    const initialNodesRef = funnelContext.nodes;

    // Call updateNodePosition with unknown node id
    act(() => {
      funnelContext.updateNodePosition('non_existent_id', 100, 200);
    });

    expect(funnelContext.nodes).toBe(initialNodesRef);
  });

  test('updates state reference when node position actually changes', () => {
    let funnelContext;

    function TestComponent() {
      funnelContext = useFunnel();
      return null;
    }

    render(
      <FunnelProvider initialNodes={sampleNodes}>
        <TestComponent />
      </FunnelProvider>
    );

    const initialNodesRef = funnelContext.nodes;

    act(() => {
      funnelContext.updateNodePosition('n1', 15, 25);
    });

    expect(funnelContext.nodes).not.toBe(initialNodesRef);
    expect(funnelContext.nodes[0].position).toEqual({ x: 15, y: 25 });
  });
});
