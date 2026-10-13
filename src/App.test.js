import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { FunnelProvider, useFunnel } from './revenue-engine/context/FunnelProvider';

test('renders funnel architect', () => {
  render(<App />);
  const linkElement = screen.getByText(/Paid Meta Framework/i);
  expect(linkElement).toBeInTheDocument();
});

test('updateNodePosition skips state update when position does not change', () => {
  let funnelContext;
  let renderCount = 0;

  const TestConsumer = () => {
    funnelContext = useFunnel();
    renderCount++;
    return <div>Nodes count: {funnelContext.nodes.length}</div>;
  };

  const initialNodes = [
    { id: 'node_1', position: { x: 100, y: 200 } }
  ];

  render(
    <FunnelProvider initialNodes={initialNodes}>
      <TestConsumer />
    </FunnelProvider>
  );

  expect(renderCount).toBe(1);

  // Call updateNodePosition with exact same position
  act(() => {
    funnelContext.updateNodePosition('node_1', 100, 200);
  });

  // Render count should still be 1 as state update was bypassed
  expect(renderCount).toBe(1);

  // Call updateNodePosition with non-existent node ID
  act(() => {
    funnelContext.updateNodePosition('node_non_existent', 300, 400);
  });

  expect(renderCount).toBe(1);

  // Call updateNodePosition with new position
  act(() => {
    funnelContext.updateNodePosition('node_1', 150, 250);
  });

  expect(renderCount).toBe(2);
  expect(funnelContext.nodes[0].position).toEqual({ x: 150, y: 250 });
});
