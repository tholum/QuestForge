import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    
    expect(result.current.count).toBe(0);
    expect(result.current.isAtMin).toBe(true);
    expect(result.current.isAtMax).toBe(false);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    
    expect(result.current.count).toBe(5);
    expect(result.current.isAtMin).toBe(false);
    expect(result.current.isAtMax).toBe(false);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 0 }));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounter({ initialValue: 5 }));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  it('should respect minimum value', () => {
    const { result } = renderHook(() => 
      useCounter({ min: 0, initialValue: 0 })
    );
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(0);
    expect(result.current.isAtMin).toBe(true);
  });

  it('should respect maximum value', () => {
    const { result } = renderHook(() => 
      useCounter({ max: 10, initialValue: 10 })
    );
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(10);
    expect(result.current.isAtMax).toBe(true);
  });

  it('should use custom step value', () => {
    const { result } = renderHook(() => 
      useCounter({ step: 5, initialValue: 0 })
    );
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(5);
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(10);
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => 
      useCounter({ initialValue: 5 })
    );
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(7);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.count).toBe(5);
  });

  it('should set value directly', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.setValue(15);
    });
    
    expect(result.current.count).toBe(15);
  });

  it('should clamp setValue to min/max bounds', () => {
    const { result } = renderHook(() => 
      useCounter({ min: 0, max: 10 })
    );
    
    act(() => {
      result.current.setValue(-5);
    });
    
    expect(result.current.count).toBe(0);
    
    act(() => {
      result.current.setValue(15);
    });
    
    expect(result.current.count).toBe(10);
  });

  it('should clamp initial value to bounds', () => {
    const { result } = renderHook(() => 
      useCounter({ min: 5, max: 10, initialValue: 0 })
    );
    
    expect(result.current.count).toBe(5);
    
    const { result: result2 } = renderHook(() => 
      useCounter({ min: 5, max: 10, initialValue: 15 })
    );
    
    expect(result2.current.count).toBe(10);
  });

  it('should provide correct boundary states', () => {
    const { result } = renderHook(() => 
      useCounter({ min: 0, max: 2, initialValue: 1 })
    );
    
    expect(result.current.isAtMin).toBe(false);
    expect(result.current.isAtMax).toBe(false);
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.isAtMin).toBe(true);
    expect(result.current.isAtMax).toBe(false);
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.isAtMin).toBe(false);
    expect(result.current.isAtMax).toBe(true);
  });

  it('should handle edge cases with same min/max', () => {
    const { result } = renderHook(() => 
      useCounter({ min: 5, max: 5, initialValue: 5 })
    );
    
    expect(result.current.count).toBe(5);
    expect(result.current.isAtMin).toBe(true);
    expect(result.current.isAtMax).toBe(true);
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(5);
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(5);
  });
});