import { Ionicons } from "@expo/vector-icons";
import { describeWeather, rainBand } from "@naboflood/hazard/rainfall";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useRainfall } from "@/hooks/use-rainfall";
import { colors } from "@/lib/colors";

/**
 * Current conditions + 3-day rainfall.
 *
 * Rendered in the BRAND colour, never the hazard ramp: millimetres of rain are
 * not a flood hazard class, and colouring them the same way would undo the
 * distinction the whole app rests on.
 *
 * Fails silently. If Open-Meteo is unreachable the panel simply says so and
 * the map carries on.
 */
export function RainfallPanel() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useRainfall();

  const today = data?.days[0];
  const band = today ? rainBand(today.precipitation) : "none";

  return (
    <View className="overflow-hidden rounded-2xl border border-hairline bg-abyss/90">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Rainfall forecast"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-2.5 px-3 py-2.5"
      >
        <Ionicons name="rainy" size={16} color={colors.tide} />
        <View className="flex-1">
          <Text className="text-xs font-bold text-ink">
            {isLoading
              ? "Checking rain…"
              : isError || !data
                ? "Rain unavailable"
                : describeWeather(data.current.weatherCode)}
          </Text>
          <Text className="text-[10px] text-ink-dim">
            {isError || !data
              ? "No connection — map still works"
              : `${today?.precipitation.toFixed(0) ?? 0} mm expected today`}
          </Text>
        </View>
        {!isError && data && band !== "none" && (
          <View
            style={{ backgroundColor: `${colors.tide}22` }}
            className="rounded-full px-2 py-0.5"
          >
            <Text style={{ color: colors.tide }} className="text-[10px] font-bold">
              {band.toUpperCase()}
            </Text>
          </View>
        )}
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.inkDim}
        />
      </Pressable>

      {open && data && !isError && (
        <View className="border-t border-hairline px-3 py-3">
          <View className="flex-row justify-between">
            {data.days.slice(0, 4).map((day, i) => {
              const mm = day.precipitation;
              // bar height is capped so one huge day doesn't flatten the rest
              const h = Math.max(4, Math.min(44, mm * 1.6));
              return (
                <View key={day.date} className="items-center gap-1.5">
                  <View className="h-11 justify-end">
                    <View
                      style={{
                        height: h,
                        backgroundColor: `${colors.tide}55`,
                        borderColor: colors.tide,
                      }}
                      className="w-7 rounded border"
                    />
                  </View>
                  <Text className="text-[10px] font-bold text-ink">
                    {mm.toFixed(0)}
                  </Text>
                  <Text className="text-[9px] text-ink-dim">
                    {i === 0 ? "Today" : weekday(day.date)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text className="mt-3 text-[9px] leading-4 text-ink-dim">
            Forecast from Open-Meteo. Rain is context, not a flood warning —
            follow PAGASA for advisories.
          </Text>
        </View>
      )}
    </View>
  );
}

function weekday(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-PH", { weekday: "short" });
}
