import { Ionicons } from "@expo/vector-icons";
import { disclaimer } from "@naboflood/hazard/copy";
import { chanceOver, scenarios } from "@naboflood/hazard/scenarios";
import { hazardTiers } from "@naboflood/hazard/tiers";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/lib/colors";

const HORIZONS = [1, 10, 30, 50];

export default function LearnScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-abyss"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <View className="gap-2 px-5">
        <Text className="text-2xl font-bold text-ink">Reading the map</Text>
        <Text className="text-sm leading-6 text-ink-dim">
          A colour is only useful if you know what it costs you. Here is each
          hazard level in metres, and what it means at your front door.
        </Text>
      </View>

      {/* ---- hazard tiers ---- */}
      <View className="mt-6 gap-3 px-5">
        {hazardTiers.map((tier) => (
          <View
            key={tier.id}
            style={{ borderColor: `${tier.color}55`, backgroundColor: `${tier.color}0d` }}
            className="gap-2 rounded-2xl border p-4"
          >
            <View className="flex-row items-center gap-2.5">
              <View
                style={{ backgroundColor: tier.color }}
                className="h-3.5 w-3.5 rounded-[4px]"
              />
              <Text style={{ color: tier.color }} className="text-lg font-bold">
                {tier.label}
              </Text>
              <Text className="text-xs text-ink-dim">{tier.depth}</Text>
            </View>
            <Text className="text-sm font-semibold text-ink">{tier.name}</Text>
            <Text className="text-sm leading-6 text-ink-dim">{tier.human}</Text>
            <View className="mt-1 flex-row gap-2 border-t border-hairline/60 pt-3">
              <Ionicons name="shield-checkmark" size={15} color={tier.color} />
              <Text className="flex-1 text-sm leading-6 text-ink">
                <Text className="font-bold">What to do: </Text>
                {tier.action}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ---- return periods ---- */}
      <View className="mt-8 gap-3 px-5">
        <Text className="text-xl font-bold text-ink">
          A “100-year flood” is not a once-a-century flood
        </Text>
        <Text className="text-sm leading-6 text-ink-dim">
          It means a 1-in-100 chance in any given year. Two can land in
          consecutive years without the model being wrong — the same way rolling
          two sixes in a row doesn&apos;t break the dice. And the risk compounds:
        </Text>

        <View className="mt-1 gap-2.5 rounded-2xl border border-hairline bg-raised/40 p-4">
          {HORIZONS.map((years) => {
            const pct = chanceOver(100, years) * 100;
            return (
              <View key={years} className="flex-row items-center gap-3">
                <Text className="w-16 text-xs text-ink-dim">
                  {years} {years === 1 ? "year" : "years"}
                </Text>
                <View className="h-2 flex-1 overflow-hidden rounded-full bg-hairline">
                  <View
                    style={{
                      width: `${Math.max(2, pct)}%`,
                      backgroundColor: colors.tide,
                    }}
                    className="h-full rounded-full"
                  />
                </View>
                <Text className="w-10 text-right text-xs font-bold text-ink">
                  {pct.toFixed(0)}%
                </Text>
              </View>
            );
          })}
          <Text className="mt-1 text-[10px] text-ink-dim">
            Chance of at least one 100-year flood, assuming independent years.
          </Text>
        </View>

        {scenarios.map((s) => (
          <View
            key={s.years}
            className="gap-1 rounded-2xl border border-hairline bg-raised/30 p-4"
          >
            <Text style={{ color: colors.tide }} className="text-xs font-bold uppercase tracking-wider">
              {s.label} · {s.annualChance} a year
            </Text>
            <Text className="text-sm leading-6 text-ink-dim">{s.blurb}</Text>
          </View>
        ))}
      </View>

      {/* ---- the disclaimer, in full ---- */}
      <View className="mt-8 px-5">
        <View
          style={{ borderColor: `${colors.hazMed}55`, backgroundColor: `${colors.hazMed}0d` }}
          className="gap-2 rounded-2xl border p-4"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="warning" size={16} color={colors.hazMed} />
            <Text className="text-base font-bold text-ink">{disclaimer.short}</Text>
          </View>
          <Text className="text-sm leading-6 text-ink-dim">{disclaimer.long}</Text>
        </View>
      </View>

      <View className="mt-4 px-5">
        <Link href="/about" asChild>
          <Pressable className="flex-row items-center justify-center gap-2 rounded-full border border-hairline py-3.5 active:opacity-70">
            <Text className="text-sm font-bold text-ink">
              Where the data comes from
            </Text>
            <Ionicons name="arrow-forward" size={15} color={colors.ink} />
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
