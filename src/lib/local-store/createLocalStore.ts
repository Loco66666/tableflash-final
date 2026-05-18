"use client";

import { useCallback, useEffect, useState } from "react";

type StoreResult<T> = {
  value: T;
  setValue: (nextValue: T | ((currentValue: T) => T)) => void;
  reset: () => void;
  hydrated: boolean;
};

function readLocalStoreValue<T>(key: string, fallbackValue: T) {
  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? (JSON.parse(storedValue) as T) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function createLocalStore<T>(key: string, initialValue: T) {
  const changeEventName = `${key}:changed`;

  return function useLocalStore(): StoreResult<T> {
    const [value, setStateValue] = useState<T>(initialValue);
    const [hydrated, setHydrated] = useState(false);

    const refreshFromStorage = useCallback(() => {
      setStateValue(readLocalStoreValue(key, initialValue));
    }, []);

    useEffect(() => {
      try {
        refreshFromStorage();
      } finally {
        setHydrated(true);
      }
    }, [refreshFromStorage]);

    useEffect(() => {
      function handleStorage(event: StorageEvent) {
        if (event.key === key) {
          refreshFromStorage();
        }
      }

      window.addEventListener("storage", handleStorage);
      window.addEventListener("focus", refreshFromStorage);
      window.addEventListener(changeEventName, refreshFromStorage);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("focus", refreshFromStorage);
        window.removeEventListener(changeEventName, refreshFromStorage);
      };
    }, [refreshFromStorage]);

    const setValue = useCallback(
      (nextValue: T | ((currentValue: T) => T)) => {
        setStateValue((currentValue) => {
          const resolvedValue =
            typeof nextValue === "function" ? (nextValue as (currentValue: T) => T)(currentValue) : nextValue;
          window.localStorage.setItem(key, JSON.stringify(resolvedValue));
          window.dispatchEvent(new Event(changeEventName));
          return resolvedValue;
        });
      },
      [],
    );

    const reset = useCallback(() => {
      window.localStorage.removeItem(key);
      window.dispatchEvent(new Event(changeEventName));
      setStateValue(initialValue);
    }, []);

    return { value, setValue, reset, hydrated };
  };
}
