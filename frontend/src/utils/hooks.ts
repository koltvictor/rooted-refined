// frontend/src/utils/hooks.ts

import { useState, useEffect } from "react"; // Add useContext

/**
 * Custom hook to debounce a value.
 * The debounced value will only update after a specified delay
 * has passed without any new updates to the original value.
 *
 * @param value The value to debounce.
 * @param delay The delay in milliseconds before the debounced value updates.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay || 500);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
