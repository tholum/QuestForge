import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'text-sm')).toBe('px-2 py-1 text-sm');
    });

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base-class', undefined, null)).toBe('base-class');
    });

    it('should handle conflicting Tailwind classes', () => {
      // Assuming cn uses tailwind-merge
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['px-2', 'py-1'], 'text-sm')).toBe('px-2 py-1 text-sm');
    });

    it('should handle objects with conditional keys', () => {
      expect(cn({
        'base-class': true,
        'conditional-class': false,
        'another-class': true
      })).toBe('base-class another-class');
    });
  });
});