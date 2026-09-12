import React from 'react';
import { render, act } from '@testing-library/react';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onRender, onNodesRef }) => {
  const { nodes, updateNodePosition } = useFunnel();
  onRender();
  onNodesRef(nodes, updateNodePosition);
  return null;
};

describe('FunnelProvider performance optimizations', () => {
  it('bails out of state update when position coordinates are unchanged', () => {
    let renderCount = 0;
    let currentNodes = null;
    let updatePos = null;

    const initialNodes = [
      { id: 'node_1', position: { x: 100, y: 100 } },
    ];

    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent
          onRender={() => { renderCount++; }}
          onNodesRef={(nodes, update) => {
            currentNodes = nodes;
            updatePos = update;
          }}
        />
      </FunnelProvider>
    );

    expect(renderCount).toBe(1);
    const initialNodesRef = currentNodes;

    // Call updateNodePosition with exact same coordinates
    act(() => {
      updatePos('node_1', 100, 100);
    });

    // Render count should remain 1 because React state update was bailed out
    expect(renderCount).toBe(1);
    expect(currentNodes).toBe(initialNodesRef);

    // Call updateNodePosition with new coordinates
    act(() => {
      updatePos('node_1', 150, 200);
    });

    // Render count should increment to 2
    expect(renderCount).toBe(2);
    expect(currentNodes[0].position).toEqual({ x: 150, y: 200 });
  });
});
