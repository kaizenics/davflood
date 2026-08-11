import { useEffect, useState } from "react";

/**
 * A clock that ticks slowly, for relative timestamps.
 *
 * "3 minutes ago" rendered once and never updated becomes a lie by degrees,
 * and the only way to keep it honest is to re-render. Every 30 seconds is the
 * compromise: fine enough that a minute counter is never more than half a
 * minute stale, coarse enough that a list of reports is not re-rendering
 * every second on a phone somebody is trying to save battery on.
 *
 * Starts at null and only ticks after mount. Prerendered HTML and the first
 * client render therefore agree on the same starting instant — a clock read
 * during render is the classic hydration mismatch.
 */
export function useNow(intervalMs = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
