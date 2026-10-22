import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders funnel architect', () => {
  render(<App />);
  const linkElement = screen.getByText(/Paid Meta Framework/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders SVG edges with flattened primitive coordinates', () => {
  const { container } = render(<App />);
  const paths = container.querySelectorAll('svg path');
  // Initial edges: edge_001 (isActive: true -> 2 path elements: glow + main), edge_002 (isActive: false -> 1 path element: main)
  expect(paths.length).toBe(3);
  // Path for edge_001 starting from sourceNode (60+256=316, 120+57=177)
  expect(paths[0].getAttribute('d')).toContain('M 316 177');
});
