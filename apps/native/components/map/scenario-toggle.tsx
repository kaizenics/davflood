import { scenarios } from "@naboflood/hazard/scenarios";
import type { ScenarioYears } from "@naboflood/hazard/scenarios";
import * as Haptics from "expo-haptics";
import { Platform, Pressable, Text, View } from "react-native";

type Props = {
  value: ScenarioYears;
  onChange: (value: ScenarioYears) => void;
};

/**
 * 5 / 25 / 100-year switch.
 *
 * Deliberately uses the brand accent, never a hazard colour — the control is
 * not itself a severity signal, and conflating the two is how people
 * misread a map.
 */
export function ScenarioToggle({ value, onChange }: Props) {
  return (
    <View className="flex-row rounded-full border border-hairline bg-abyss/90 p-1">
      {scenarios.map((s) => {
        const active = s.years === value;
        return (
          <Pressable
            key={s.years}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${s.label} flood scenario`}
            onPress={() => {
              if (Platform.OS === "ios") {
                void Haptics.selectionAsync();
              }
              onChange(s.years);
            }}
            className={`rounded-full px-3.5 py-2 ${active ? "bg-tide" : ""}`}
          >
            <Text
              className={`text-xs font-bold ${active ? "text-abyss" : "text-ink-dim"}`}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
