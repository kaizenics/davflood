import { Ionicons } from "@expo/vector-icons";
import { barangays, searchBarangays } from "@naboflood/hazard/barangays";
import type { Barangay } from "@naboflood/hazard/barangays";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/lib/colors";

export default function BarangaysScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchBarangays(query), [query]);

  function open(b: Barangay) {
    // the map owns the camera; this just tells it where to go
    router.push({
      pathname: "/",
      params: { lng: String(b.center[0]), lat: String(b.center[1]) },
    });
  }

  return (
    <View className="flex-1 bg-abyss" style={{ paddingTop: insets.top }}>
      <View className="gap-3 px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-ink">Find your barangay</Text>
        <Text className="text-sm text-ink-dim">
          All {barangays.length} barangays of Panabo City. Tap one to jump the map
          there.
        </Text>

        <View className="mt-1 flex-row items-center gap-2.5 rounded-full border border-hairline bg-raised/60 px-4">
          <Ionicons name="search" size={16} color={colors.inkDim} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name…"
            placeholderTextColor={colors.inkDim}
            autoCorrect={false}
            clearButtonMode="while-editing"
            className="flex-1 py-3 text-base text-ink"
            style={{ color: colors.ink }}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery("")}
            >
              <Ionicons name="close-circle" size={16} color={colors.inkDim} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(b) => b.name}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="items-center px-5 py-16">
            <Ionicons name="search" size={28} color={colors.hairline} />
            <Text className="mt-3 text-sm text-ink-dim">
              No barangay matches “{query}”.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show Barangay ${item.name} on the map`}
            onPress={() => open(item)}
            className="mx-5 flex-row items-center gap-3 border-b border-hairline/60 py-3.5 active:opacity-60"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full border border-hairline bg-raised/60">
              <Ionicons
                name={item.poblacion ? "business" : "leaf"}
                size={15}
                color={colors.tide}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-ink">{item.name}</Text>
              {item.poblacion && (
                <Text className="text-[11px] text-ink-dim">Poblacion</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.inkDim} />
          </Pressable>
        )}
      />

      <Text className="px-5 pb-3 text-[10px] leading-4 text-ink-dim">
        Barangay positions are approximate until the surveyed boundary data is
        loaded.
      </Text>
    </View>
  );
}
