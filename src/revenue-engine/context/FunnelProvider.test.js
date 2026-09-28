import React from 'react';
import { render, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunnelProvider, useFunnel } from './FunnelProvider';

const TestComponent = ({ onRender }) => {
  const { nodes, updateNodePosition } = useFunnel();
  if (onRender) onRender(nodes);

  return (
    <div>
      {nodes.map((n) => (
        <div key={n.id} data-testid={`node-${n.id}`}>
          {n.position.x},{n.position.y}
        </div>
      ))}
      <button
        data-testid="move-btn"
        onClick={() => updateNodePosition('n1', 100, 200)}
      >
        Move N1
      </button>
      <button
        data-testid="same-btn"
        onClick={() => updateNodePosition('n1', 100, 200)}
      >
        Move N1 Same
      </button>
      <button
        data-testid="nonexistent-btn"
        onClick={() => updateNodePosition('n999', 500, 500)}
      >
        Move Invalid
      </button>
    </div>
  );
};

describe('FunnelProvider', () => {
  const initialNodes = [
    { id: 'n1', position: { x: 10, y: 20 } },
    { id: 'n2', position: { x: 30, y: 40 } },
  ];

  it('updates node position when coordinates change', () => {
    const renderSpy = jest.fn();
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent onRender={renderSpy} />
      </FunnelProvider>
    );

    expect(screen.getByTestId('node-n1')).toHaveTextContent('10,20');
    expect(renderSpy).toHaveBeenCalledTimes(1);

    act(() => {
      screen.getByTestId('move-btn').click();
    });

    expect(screen.getByTestId('node-n1')).toHaveTextContent('100,200');
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  it('bails out and skips state update if position is unchanged', () => {
    const renderSpy = jest.fn();
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent onRender={renderSpy} />
      </FunnelProvider>
    );

    act(() => {
      screen.getByTestId('move-btn').click();
    });
    expect(renderSpy).toHaveBeenCalledTimes(2);

    // Clicking same-btn with identical coordinates should not trigger a re-render
    act(() => {
      screen.getByTestId('same-btn').click();
    });

    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  it('bails out when updating non-existent node ID', () => {
    const renderSpy = jest.fn();
    render(
      <FunnelProvider initialNodes={initialNodes}>
        <TestComponent onRender={renderSpy} />
      </FunnelProvider>
    );

    act(() => {
      screen.getByTestId('nonexistent-btn').click();
    });

    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});
