import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ErrorScreen } from '../ErrorScreen.js';

// Mock ink components
vi.mock('ink', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Text: ({ children, color, bold, ...props }: any) => (
    <span style={{ color, fontWeight: bold ? 'bold' : 'normal' }} {...props}>
      {children}
    </span>
  ),
}));

describe('ErrorScreen', () => {
  it('should render error message', () => {
    const errorMessage = 'Test error message';
    const { getByText } = render(<ErrorScreen error={errorMessage} />);

    expect(getByText('Error')).toBeInTheDocument();
    expect(getByText(errorMessage)).toBeInTheDocument();
    expect(getByText('Press Escape to go back')).toBeInTheDocument();
  });

  it('should render with correct styling', () => {
    const errorMessage = 'Test error';
    const { getByText } = render(<ErrorScreen error={errorMessage} />);

    const errorTitle = getByText('Error');
    expect(errorTitle).toHaveStyle({ fontWeight: 'bold', color: 'red' });

    const errorText = getByText(errorMessage);
    expect(errorText).toHaveStyle({ color: 'red' });

    const helpText = getByText('Press Escape to go back');
    expect(helpText).toHaveStyle({ color: 'gray' });
  });

  it('should handle empty error message', () => {
    const { getByText } = render(<ErrorScreen error="" />);

    expect(getByText('Error')).toBeInTheDocument();
    expect(getByText('Press Escape to go back')).toBeInTheDocument();
  });

  it('should handle long error messages', () => {
    const longError =
      'This is a very long error message that might span multiple lines and contains detailed information about what went wrong during the operation';
    const { getByText } = render(<ErrorScreen error={longError} />);

    expect(getByText(longError)).toBeInTheDocument();
  });
});
