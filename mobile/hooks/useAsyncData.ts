import { useState, useEffect, useCallback, useRef } from "react";
import { useNetworkStatus } from "./useNetworkStatus";

interface AsyncDataState<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
}

interface UseAsyncDataOptions<T> {
  initialData?: T | null;
  enabled?: boolean;
  retryCount?: number;
  retryDelay?: number;
  refetchOnReconnect?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseAsyncDataReturn<T> extends AsyncDataState<T> {
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const {
    initialData = null,
    enabled = true,
    retryCount = 3,
    retryDelay = 1000,
    refetchOnReconnect = true,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<AsyncDataState<T>>({
    data: initialData,
    isLoading: enabled,
    isRefreshing: false,
    error: null,
    isError: false,
    isSuccess: false,
  });

  const { isConnected, isInternetReachable } = useNetworkStatus();
  const mountedRef = useRef(true);
  const retriesRef = useRef(0);
  const fetchFnRef = useRef(fetchFn);
  const wasOfflineRef = useRef(false);

  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!mountedRef.current) return;

    setState((prev) => ({
      ...prev,
      isLoading: !isRefresh && !prev.data,
      isRefreshing: isRefresh,
      error: null,
      isError: false,
    }));

    try {
      const data = await fetchFnRef.current();

      if (!mountedRef.current) return;

      setState({
        data,
        isLoading: false,
        isRefreshing: false,
        error: null,
        isError: false,
        isSuccess: true,
      });

      retriesRef.current = 0;
      onSuccess?.(data);
    } catch (err) {
      if (!mountedRef.current) return;

      const error = err instanceof Error ? err : new Error(String(err));

      if (retriesRef.current < retryCount) {
        retriesRef.current += 1;
        setTimeout(() => {
          if (mountedRef.current) {
            fetchData(isRefresh);
          }
        }, retryDelay * retriesRef.current);
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error,
        isError: true,
        isSuccess: false,
      }));

      onError?.(error);
    }
  }, [retryCount, retryDelay, onSuccess, onError]);

  const refetch = useCallback(async () => {
    retriesRef.current = 0;
    await fetchData(false);
  }, [fetchData]);

  const refresh = useCallback(async () => {
    retriesRef.current = 0;
    await fetchData(true);
  }, [fetchData]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      isRefreshing: false,
      error: null,
      isError: false,
      isSuccess: false,
    });
    retriesRef.current = 0;
  }, [initialData]);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({
      ...prev,
      data,
      isSuccess: data !== null,
    }));
  }, []);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled]);

  // Refetch on reconnect
  useEffect(() => {
    const isOnline = isConnected && isInternetReachable !== false;

    if (wasOfflineRef.current && isOnline && refetchOnReconnect && enabled) {
      refetch();
    }

    wasOfflineRef.current = !isOnline;
  }, [isConnected, isInternetReachable, refetchOnReconnect, enabled, refetch]);

  return {
    ...state,
    refetch,
    refresh,
    reset,
    setData,
  };
}

export default useAsyncData;
