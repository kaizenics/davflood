import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const KEY = "naboflood.onboarded.v1";

/**
 * First-run gate. Uses SecureStore because it is already a dependency
 * (better-auth pulls it in) — this is not secret data, it just avoids adding
 * another storage library for one boolean.
 */
export function useOnboarding() {
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(KEY)
      .then((v) => {
        if (active) setNeedsOnboarding(v !== "1");
      })
      .catch(() => {
        // storage unavailable — show onboarding rather than silently skipping
        if (active) setNeedsOnboarding(true);
      })
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const complete = useCallback(async () => {
    setNeedsOnboarding(false);
    try {
      await SecureStore.setItemAsync(KEY, "1");
    } catch {
      // if this fails the user sees onboarding again — annoying, not broken
    }
  }, []);

  return { checked, needsOnboarding, complete };
}
