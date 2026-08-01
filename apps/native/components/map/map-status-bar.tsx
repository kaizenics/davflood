import { Ionicons } from "@expo/vector-icons";
import { disclaimer } from "@naboflood/hazard/copy";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useNetworkStatus } from "@/hooks/use-network-status";
import { DATA_IS_PLACEHOLDER } from "@/lib/hazard-source";
import { colors } from "@/lib/colors";

/**
 * The persistent honesty strip.
 *
 * A hazard map that looks live is dangerous, so the "modelled, not live"
 * statement is always on screen — not buried in an About page. Tapping it
 * opens the full explanation.
 */
export function MapStatusBar() {
  const isOnline = useNetworkStatus();

  return (
    <View className="gap-2">
      {DATA_IS_PLACEHOLDER && (
        <View
          style={{ backgroundColor: `${colors.hazMed}1f`, borderColor: `${colors.hazMed}66` }}
          className="flex-row items-center gap-2 rounded-full border px-3 py-1.5"
        >
          <Ionicons name="construct" size={12} color={colors.hazMed} />
          <Text style={{ color: colors.hazMed }} className="text-[10px] font-bold">
            PLACEHOLDER DATA — NOT REAL HAZARD INFORMATION
          </Text>
        </View>
      )}

      <View className="flex-row items-center gap-2">
        <Link href="/about" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${disclaimer.short} Read more about the data.`}
            className="flex-1 flex-row items-center gap-2 rounded-full border border-hairline bg-abyss/90 px-3 py-1.5 active:opacity-70"
          >
            <Ionicons name="information-circle" size={13} color={colors.inkDim} />
            <Text className="flex-1 text-[10px] text-ink-dim" numberOfLines={1}>
              {disclaimer.pill}
            </Text>
          </Pressable>
        </Link>

        {!isOnline && (
          <View className="flex-row items-center gap-1.5 rounded-full border border-hairline bg-abyss/90 px-2.5 py-1.5">
            <Ionicons name="cloud-offline" size={12} color={colors.inkDim} />
            <Text className="text-[10px] font-bold text-ink-dim">OFFLINE</Text>
          </View>
        )}
      </View>
    </View>
  );
}
