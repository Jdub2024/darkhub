import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders funnel architect', () => {
  render(<App />);
  const linkElement = screen.getByText(/Paid Meta Framework/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders SVG edges with correct path coordinates', () => {
  const { container } = render(<App />);
  const paths = container.querySelectorAll('svg path');
  expect(paths.length).toBeGreaterThan(0);

  // Verify path attribute contains expected coordinate data (cubic bezier 'C')
  const pathD = paths[0].getAttribute('d');
  expect(pathD).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)? C/);
});
