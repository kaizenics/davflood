import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

const KEY = "naboflood.onboarded.v1";

/**
 * First-run gate. Uses SecureStore on device — not because the flag is
 * secret, but because it avoids adding a storage library for one boolean.
 *
 * SecureStore is unavailable on web and throws, which would re-show
 * onboarding on every reload and make the web preview unusable. localStorage
 * covers that case.
 */
const store = {
	async get(): Promise<string | null> {
		if (Platform.OS === "web") {
			return globalThis.localStorage?.getItem(KEY) ?? null;
		}
		return SecureStore.getItemAsync(KEY);
	},
	async set(value: string): Promise<void> {
		if (Platform.OS === "web") {
			globalThis.localStorage?.setItem(KEY, value);
			return;
		}
		await SecureStore.setItemAsync(KEY, value);
	},
};
export function useOnboarding() {
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let active = true;
    store
      .get()
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
      await store.set("1");
    } catch {
      // if this fails the user sees onboarding again — annoying, not broken
    }
  }, []);

  return { checked, needsOnboarding, complete };
}
