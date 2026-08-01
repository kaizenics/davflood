import { Ionicons } from "@expo/vector-icons";
import { dataSources, disclaimer, mapAttribution } from "@naboflood/hazard/copy";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "@/lib/colors";
import { DATA_IS_PLACEHOLDER } from "@/lib/hazard-source";

export default function AboutScreen() {
  return (
    <ScrollView
      className="flex-1 bg-abyss"
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      {DATA_IS_PLACEHOLDER && (
        <View
          style={{ borderColor: `${colors.hazMed}66`, backgroundColor: `${colors.hazMed}14` }}
          className="mb-5 gap-2 rounded-2xl border p-4"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="construct" size={16} color={colors.hazMed} />
            <Text className="text-sm font-bold text-ink">
              This build uses placeholder data
            </Text>
          </View>
          <Text className="text-sm leading-6 text-ink-dim">
            The hazard zones currently shown are synthetic — generated to build
            and test the app while the real UP NOAH dataset is being obtained.
            They are not a description of real flood risk in Panabo City and
            must not be used to make decisions.
          </Text>
        </View>
      )}

      <Text className="text-xl font-bold text-ink">{disclaimer.short}</Text>
      <Text className="mt-2 text-sm leading-6 text-ink-dim">{disclaimer.long}</Text>
      <Text className="mt-3 text-sm leading-6 text-ink-dim">
        {disclaimer.independence}
      </Text>

      <Text className="mt-8 text-lg font-bold text-ink">Data sources</Text>
      <Text className="mt-1 text-sm leading-6 text-ink-dim">
        Every layer is public data produced by people who made it public on
        purpose. Crediting them is a licence obligation, not a courtesy.
      </Text>

      <View className="mt-4 gap-3">
        {dataSources.map((source) => (
          <Pressable
            key={source.name}
            accessibilityRole="link"
            accessibilityLabel={`${source.name} — open website`}
            onPress={() => {
              void Linking.openURL(source.url);
            }}
            className="gap-1.5 rounded-2xl border border-hairline bg-raised/40 p-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-bold text-ink">{source.name}</Text>
              <Ionicons name="open-outline" size={13} color={colors.inkDim} />
            </View>
            <Text className="text-[11px] text-ink-dim">{source.full}</Text>
            <Text className="mt-1 text-sm leading-6 text-ink-dim">{source.role}</Text>
            <Text className="mt-1 text-[11px] font-semibold" style={{ color: colors.tide }}>
              {source.licence}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mt-8 text-[11px] leading-5 text-ink-dim">
        {mapAttribution}
      </Text>
      <Text className="mt-2 text-[11px] leading-5 text-ink-dim">
        NaboFlood is free, has no accounts, shows no ads and collects no
        analytics. A flood map does not need to know who you are.
      </Text>
    </ScrollView>
  );
}
