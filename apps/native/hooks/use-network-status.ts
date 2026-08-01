import * as Network from "expo-network";
import { useEffect, useState } from "react";

/**
 * Online/offline state for the map badge.
 *
 * This is informational only — nothing in the app gates on it. The hazard
 * layer is bundled, so being offline changes what the *basemap* looks like,
 * not whether the app works.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let active = true;

    Network.getNetworkStateAsync()
      .then((s) => {
        if (active) setIsOnline(Boolean(s.isInternetReachable ?? s.isConnected));
      })
      .catch(() => {
        // never let a status probe break the map
      });

    const sub = Network.addNetworkStateListener((s) => {
      setIsOnline(Boolean(s.isInternetReachable ?? s.isConnected));
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return isOnline;
}
