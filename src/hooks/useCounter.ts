import { useState, useCallback } from 'react';

export interface UseCounterOptions {
  min?: number;
  max?: number;
  step?: number;
  initialValue?: number;
}

export function useCounter(options: UseCounterOptions = {}) {
  const {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    step = 1,
    initialValue = 0,
  } = options;

  const [count, setCount] = useState(
    Math.max(min, Math.min(max, initialValue))
  );

  const increment = useCallback(() => {
    setCount((prev) => Math.min(max, prev + step));
  }, [max, step]);

  const decrement = useCallback(() => {
    setCount((prev) => Math.max(min, prev - step));
  }, [min, step]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const setValue = useCallback(
    (value: number) => {
      setCount(Math.max(min, Math.min(max, value)));
    },
    [min, max]
  );

  return {
    count,
    increment,
    decrement,
    reset,
    setValue,
    isAtMin: count === min,
    isAtMax: count === max,
  };
}