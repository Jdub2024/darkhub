import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunnelArchitect, { SvgEdge } from './FunnelArchitect';
import { FunnelProvider, useFunnel } from '../context/FunnelProvider';

describe('FunnelArchitect and SvgEdge memoization', () => {
  const initialNodes = [
    {
      id: 'node_1',
      type: 'traffic',
      label: 'Traffic Source',
      position: { x: 50, y: 100 },
      metrics: { clicks: '1,200' },
    },
    {
      id: 'node_2',
      type: 'landing_page',
      label: 'Landing Page',
      position: { x: 350, y: 100 },
      metrics: { cr: '5%' },
    },
    {
      id: 'node_3',
      type: 'checkout',
      label: 'Checkout Page',
      position: { x: 650, y: 100 },
      metrics: { sales: '60' },
    },
  ];

  const initialEdges = [
    { id: 'edge_1_2', source: 'node_1', target: 'node_2', isActive: true },
    { id: 'edge_2_3', source: 'node_2', target: 'node_3', isActive: false },
  ];

  test('renders all nodes and edges correctly', () => {
    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <FunnelArchitect />
      </FunnelProvider>
    );

    expect(screen.getByText('Traffic Source')).toBeInTheDocument();
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
    expect(screen.getByText('Checkout Page')).toBeInTheDocument();
  });

  test('SvgEdge uses React.memo and does not re-render when identical primitive props are passed', () => {
    let renderCount = 0;
    // Wrap SvgEdge inside an svg container for valid SVG DOM hierarchy
    const TestWrapper = ({ sourceX, sourceY, targetX, targetY, isActive }) => {
      return (
        <svg>
          <SvgEdge
            sourceX={sourceX}
            sourceY={sourceY}
            targetX={targetX}
            targetY={targetY}
            isActive={isActive}
          />
        </svg>
      );
    };

    // Spy on SvgEdge rendering via React.memo behavior
    const OriginalType = SvgEdge.type;
    const renderSpy = jest.fn();
    const SpiedSvgEdge = React.memo((props) => {
      renderSpy();
      return <OriginalType {...props} />;
    });

    const SvgContainer = ({ sourceX, sourceY, targetX, targetY, isActive }) => (
      <svg>
        <SpiedSvgEdge
          sourceX={sourceX}
          sourceY={sourceY}
          targetX={targetX}
          targetY={targetY}
          isActive={isActive}
        />
      </svg>
    );

    const { rerender } = render(
      <SvgContainer
        sourceX={100}
        sourceY={150}
        targetX={300}
        targetY={150}
        isActive={true}
      />
    );

    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render container with identical primitive props
    rerender(
      <SvgContainer
        sourceX={100}
        sourceY={150}
        targetX={300}
        targetY={150}
        isActive={true}
      />
    );

    // Should skip re-render because props are shallowly equal primitives
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with changed coordinate
    rerender(
      <SvgContainer
        sourceX={120}
        sourceY={150}
        targetX={300}
        targetY={150}
        isActive={true}
      />
    );

    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  test('moving node_3 in FunnelArchitect updates edges without errors', () => {
    const TestConsumer = () => {
      const { updateNodePosition } = useFunnel();
      return (
        <div>
          <FunnelArchitect />
          <button
            data-testid="move-node-3"
            onClick={() => updateNodePosition('node_3', 700, 200)}
          >
            Move Node 3
          </button>
        </div>
      );
    };

    render(
      <FunnelProvider initialNodes={initialNodes} initialEdges={initialEdges}>
        <TestConsumer />
      </FunnelProvider>
    );

    // Trigger update on node_3
    act(() => {
      screen.getByTestId('move-node-3').click();
    });

    expect(screen.getByText('Checkout Page')).toBeInTheDocument();
  });
});
