import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders funnel architect with nodes and edge paths', () => {
  const { container } = render(<App />);

  // Verify nodes render
  expect(screen.getByText(/Paid Meta Framework/i)).toBeInTheDocument();
  expect(screen.getByText(/V1 Main Sales Flow/i)).toBeInTheDocument();
  expect(screen.getByText(/Premium Suite Core/i)).toBeInTheDocument();

  // Verify SVG connection edge paths render
  const svgPaths = container.querySelectorAll('svg path');
  expect(svgPaths.length).toBeGreaterThan(0);
});
