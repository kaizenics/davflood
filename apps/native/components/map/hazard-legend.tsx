import { hazardTiers } from "@naboflood/hazard/tiers";
import { Text, View } from "react-native";

/**
 * The legend.
 *
 * Every swatch carries its label AND its depth band. Colour is never the sole
 * information channel — roughly 8% of men have a colour vision deficiency, and
 * this is safety information, not decoration.
 */
export function HazardLegend({ compact = false }: { compact?: boolean }) {
  return (
    <View className="rounded-2xl border border-hairline bg-abyss/90 px-3 py-2.5">
      {!compact && (
        <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-dim">
          Hazard level
        </Text>
      )}
      <View className={compact ? "flex-row gap-4" : "gap-2"}>
        {hazardTiers.map((tier) => (
          <View key={tier.id} className="flex-row items-center gap-2">
            <View
              accessible={false}
              style={{ backgroundColor: tier.color }}
              className="h-3 w-3 rounded-[3px]"
            />
            <Text className="text-xs font-bold text-ink">{tier.label}</Text>
            {!compact && (
              <Text className="text-xs text-ink-dim">{tier.depthShort}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
