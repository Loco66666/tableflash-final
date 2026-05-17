"use client";

import { useCallback, useEffect, useState } from "react";

type StoreResult<T> = {
  value: T;
  setValue: (nextValue: T | ((currentValue: T) => T)) => void;
  reset: () => void;
  hydrated: boolean;
};

export function createLocalStore<T>(key: string, initialValue: T) {
  return function useLocalStore(): StoreResult<T> {
    const [value, setStateValue] = useState<T>(initialValue);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
      try {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue) {
          setStateValue(JSON.parse(storedValue) as T);
        }
      } finally {
        setHydrated(true);
      }
    }, []);

    const setValue = useCallback(
      (nextValue: T | ((currentValue: T) => T)) => {
        setStateValue((currentValue) => {
          const resolvedValue =
            typeof nextValue === "function" ? (nextValue as (currentValue: T) => T)(currentValue) : nextValue;
          window.localStorage.setItem(key, JSON.stringify(resolvedValue));
          return resolvedValue;
        });
      },
      [],
    );

    const reset = useCallback(() => {
      window.localStorage.removeItem(key);
      setStateValue(initialValue);
    }, []);

    return { value, setValue, reset, hydrated };
  };
}
