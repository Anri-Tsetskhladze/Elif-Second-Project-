import { useCallback, useRef, useMemo, useEffect, useState } from "react";
import { InteractionManager, Platform } from "react-native";

// Debounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook
export const useThrottle = <T>(value: T, interval: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastExecuted.current;

    if (elapsed >= interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval - elapsed);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
};

// Debounced callback hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  interval: number,
  deps: React.DependencyList = []
): T => {
  const lastExecuted = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastExecuted.current;

      if (elapsed >= interval) {
        lastExecuted.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastExecuted.current = Date.now();
          callback(...args);
          timeoutRef.current = undefined;
        }, interval - elapsed);
      }
    }) as T,
    [callback, interval, ...deps]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

// Run after interactions (useful for heavy operations)
export const useAfterInteraction = (
  callback: () => void,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      callback();
    });

    return () => handle.cancel();
  }, deps);
};

// Lazy initialization hook
export const useLazyInit = <T>(initializer: () => T): T => {
  const ref = useRef<{ value: T; initialized: boolean }>({
    value: undefined as any,
    initialized: false,
  });

  if (!ref.current.initialized) {
    ref.current.value = initializer();
    ref.current.initialized = true;
  }

  return ref.current.value;
};

// Previous value hook
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

// Stable callback hook (prevents re-renders)
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }) as T, []);
};

// Mounted ref hook
export const useMountedRef = () => {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
};

// Safe state update hook
export const useSafeState = <T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] => {
  const [state, setState] = useState<T>(initialValue);
  const mountedRef = useMountedRef();

  const setSafeState = useCallback((value: T | ((prev: T) => T)) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
};

// Memory cache hook for expensive computations
export const useMemoCache = <K, V>(
  computeFn: (key: K) => V,
  maxSize: number = 100
) => {
  const cache = useLazyInit(() => new Map<K, V>());

  const get = useCallback((key: K): V => {
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    // Evict oldest if at max size
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    const value = computeFn(key);
    cache.set(key, value);
    return value;
  }, [computeFn, maxSize]);

  const clear = useCallback(() => {
    cache.clear();
  }, []);

  return { get, clear };
};

// Render count hook (for debugging)
export const useRenderCount = (componentName: string) => {
  const count = useRef(0);
  count.current++;

  if (__DEV__) {
    console.log(`[Render] ${componentName}: ${count.current}`);
  }

  return count.current;
};

// Platform-specific optimization
export const usePlatformOptimization = () => {
  return useMemo(
    () => ({
      isIOS: Platform.OS === "ios",
      isAndroid: Platform.OS === "android",
      // iOS has better scroll performance
      scrollViewProps: Platform.select({
        ios: { bounces: true, decelerationRate: "normal" },
        android: { overScrollMode: "never" as const },
      }),
      // List optimization props
      listProps: Platform.select({
        ios: { removeClippedSubviews: false }, // iOS handles this well
        android: { removeClippedSubviews: true },
      }),
    }),
    []
  );
};

export default {
  useDebounce,
  useThrottle,
  useDebouncedCallback,
  useThrottledCallback,
  useAfterInteraction,
  useLazyInit,
  usePrevious,
  useStableCallback,
  useMountedRef,
  useSafeState,
  useMemoCache,
  useRenderCount,
  usePlatformOptimization,
};
