import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders funnel architect', () => {
  render(<App />);
  const linkElement = screen.getByText(/Paid Meta Framework/i);
  expect(linkElement).toBeInTheDocument();
});
