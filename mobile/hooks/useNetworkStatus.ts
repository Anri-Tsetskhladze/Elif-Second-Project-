import { useState, useEffect, useCallback } from "react";
import * as Network from "expo-network";

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: Network.NetworkStateType | null;
  isWifi: boolean;
  isCellular: boolean;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  refresh: () => Promise<NetworkStatus>;
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    isWifi: false,
    isCellular: false,
  });

  const getNetworkStatus = useCallback(async (): Promise<NetworkStatus> => {
    try {
      const state = await Network.getNetworkStateAsync();
      const newStatus: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type ?? null,
        isWifi: state.type === Network.NetworkStateType.WIFI,
        isCellular: state.type === Network.NetworkStateType.CELLULAR,
      };
      return newStatus;
    } catch {
      return {
        isConnected: false,
        isInternetReachable: false,
        type: null,
        isWifi: false,
        isCellular: false,
      };
    }
  }, []);

  const refresh = useCallback(async (): Promise<NetworkStatus> => {
    const newStatus = await getNetworkStatus();
    setStatus(newStatus);
    return newStatus;
  }, [getNetworkStatus]);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const checkNetwork = async () => {
      if (!mounted) return;
      const newStatus = await getNetworkStatus();
      if (mounted) {
        setStatus(newStatus);
      }
    };

    checkNetwork();

    // Poll for network changes every 5 seconds
    intervalId = setInterval(checkNetwork, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [getNetworkStatus]);

  return {
    ...status,
    refresh,
  };
};

export default useNetworkStatus;
