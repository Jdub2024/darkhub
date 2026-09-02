import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders funnel architect with node and edge elements', () => {
  const { container } = render(<App />);
  const linkElement = screen.getByText(/Paid Meta Framework/i);
  expect(linkElement).toBeInTheDocument();

  // Verify SVG path elements for edges rendered with primitive coordinates
  const svgPaths = container.querySelectorAll('svg path');
  expect(svgPaths.length).toBeGreaterThan(0);
});
