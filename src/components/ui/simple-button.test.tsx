import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimpleButton } from './simple-button';

describe('SimpleButton Component', () => {
  it('should render with default props', () => {
    render(<SimpleButton>Click me</SimpleButton>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-500', 'text-white');
    expect(button).not.toBeDisabled();
  });

  it('should render different variants', () => {
    const { rerender } = render(<SimpleButton variant="primary">Primary</SimpleButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-500', 'text-white');

    rerender(<SimpleButton variant="secondary">Secondary</SimpleButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-300', 'text-gray-800');
  });

  it('should handle disabled state', () => {
    render(<SimpleButton disabled>Disabled</SimpleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<SimpleButton onClick={handleClick}>Click me</SimpleButton>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <SimpleButton disabled onClick={handleClick}>
        Disabled Button
      </SimpleButton>
    );
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<SimpleButton className="custom-class">Custom</SimpleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('bg-blue-500'); // Should still have default classes
  });

  it('should handle keyboard interactions', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<SimpleButton onClick={handleClick}>Keyboard Button</SimpleButton>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  describe('Accessibility', () => {
    it('should be focusable', () => {
      render(<SimpleButton>Focusable</SimpleButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have proper button role', () => {
      render(<SimpleButton>Button Role</SimpleButton>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support screen readers', () => {
      render(<SimpleButton>Screen Reader Button</SimpleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveTextContent('Screen Reader Button');
    });
  });
});