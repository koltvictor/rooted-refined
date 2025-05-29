// frontend/src/utils/hooks.ts

import { useState, useEffect } from "react";

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
    // Set a timeout that will update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay || 500); // Default delay of 500ms if not provided

    // Cleanup function: This is important. If 'value' changes again before the timeout fires,
    // clear the previous timeout. This ensures the debounced value only updates
    // after a period of inactivity.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run the effect if value or delay changes

  return debouncedValue;
}
