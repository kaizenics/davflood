import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { formatDepth } from "@naboflood/hazard/schema";
import type { HazardProperties } from "@naboflood/hazard/schema";
import { scenarioByYears } from "@naboflood/hazard/scenarios";
import { hazardById } from "@naboflood/hazard/tiers";
import { useCallback, useMemo, useRef, useEffect } from "react";
import { Text, View } from "react-native";

import { colors } from "@/lib/colors";

type Props = {
  zone: HazardProperties | null;
  onClose: () => void;
};

/**
 * The tap-a-zone info card.
 *
 * Order is deliberate: WHERE, then HOW DEEP, then WHAT THAT MEANS, then WHAT
 * TO DO. Someone reading this in a hurry should get the actionable part
 * without scrolling, so the guidance sits above the fold of the first snap
 * point.
 */
export function ZoneSheet({ zone, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["42%", "78%"], []);

  useEffect(() => {
    if (zone) sheetRef.current?.snapToIndex(0);
    else sheetRef.current?.close();
  }, [zone]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const tier = zone ? hazardById[zone.hazard] : null;
  const scenario = zone ? scenarioByYears[zone.scenario] : null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.hairline }}
    >
      {zone && tier && scenario ? (
        <BottomSheetScrollView contentContainerClassName="px-5 pb-10">
          <View
            style={{ backgroundColor: tier.color }}
            className="mb-4 h-1 w-12 rounded-full"
          />

          <Text className="text-[10px] font-bold uppercase tracking-widest text-ink-dim">
            Selected zone
          </Text>
          <Text className="mt-1 text-2xl font-bold text-ink">
            Brgy. {zone.barangay}
          </Text>

          <View className="mt-4 flex-row items-center gap-3">
            <View
              style={{
                backgroundColor: `${tier.color}22`,
                borderColor: `${tier.color}88`,
              }}
              className="flex-row items-center gap-2 rounded-full border px-3 py-1.5"
            >
              <View
                style={{ backgroundColor: tier.color }}
                className="h-2.5 w-2.5 rounded-full"
              />
              <Text style={{ color: tier.color }} className="text-xs font-bold">
                {tier.label.toUpperCase()}
              </Text>
            </View>
            <Text className="text-base font-bold text-ink">
              {formatDepth(zone)}
            </Text>
          </View>

          <Text className="mt-1 text-xs text-ink-dim">
            {tier.name} · {scenario.label} scenario
          </Text>

          <Text className="mt-5 text-sm leading-6 text-ink-dim">{tier.human}</Text>

          <View className="mt-5 rounded-2xl border border-hairline bg-raised/60 p-4">
            <View className="mb-2 flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={16} color={tier.color} />
              <Text className="text-xs font-bold uppercase tracking-wider text-ink">
                What to do
              </Text>
            </View>
            <Text className="text-sm leading-6 text-ink-dim">{tier.action}</Text>
          </View>

          <Text className="mt-5 text-[11px] leading-5 text-ink-dim">
            Modelled hazard for a {scenario.label} storm — roughly a{" "}
            {scenario.annualChance} chance in any given year. This is not a
            reading of water on the ground right now.
          </Text>
        </BottomSheetScrollView>
      ) : null}
    </BottomSheet>
  );
}
