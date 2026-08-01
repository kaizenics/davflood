import { Ionicons } from "@expo/vector-icons";
import { onboarding } from "@naboflood/hazard/copy";
import { hazardTiers } from "@naboflood/hazard/tiers";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/lib/colors";

const { width } = Dimensions.get("window");

const ICONS = ["water", "layers", "information-circle", "cloud-offline"] as const;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const last = page === onboarding.length - 1;

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  function next() {
    if (last) {
      router.back();
      return;
    }
    scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
  }

  return (
    <View
      className="flex-1 bg-abyss"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-row justify-end px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          onPress={() => router.back()}
          className="px-3 py-2 active:opacity-60"
        >
          <Text className="text-sm font-semibold text-ink-dim">Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        className="flex-1"
      >
        {onboarding.map((slide, i) => (
          <View key={slide.title} style={{ width }} className="flex-1 justify-center px-8">
            <View
              style={{ backgroundColor: `${colors.tide}1a`, borderColor: `${colors.tide}55` }}
              className="mb-7 h-16 w-16 items-center justify-center rounded-2xl border"
            >
              <Ionicons name={ICONS[i] ?? "water"} size={28} color={colors.tide} />
            </View>

            <Text className="text-3xl font-bold leading-10 text-ink">
              {slide.title}
            </Text>
            <Text className="mt-4 text-base leading-7 text-ink-dim">
              {slide.body}
            </Text>

            {/* the hazard ramp gets shown, not just described */}
            {i === 1 && (
              <View className="mt-7 gap-3">
                {hazardTiers.map((tier) => (
                  <View key={tier.id} className="flex-row items-center gap-3">
                    <View
                      style={{ backgroundColor: tier.color }}
                      className="h-4 w-4 rounded-[5px]"
                    />
                    <Text className="w-16 text-sm font-bold text-ink">
                      {tier.label}
                    </Text>
                    <Text className="flex-1 text-sm text-ink-dim">
                      {tier.summary}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center justify-center gap-2 py-6">
        {onboarding.map((slide, i) => (
          <View
            key={slide.title}
            style={{
              backgroundColor: i === page ? colors.tide : colors.hairline,
              width: i === page ? 20 : 7,
            }}
            className="h-[7px] rounded-full"
          />
        ))}
      </View>

      <View className="px-8">
        <Pressable
          accessibilityRole="button"
          onPress={next}
          style={{ backgroundColor: colors.tide }}
          className="items-center rounded-full py-4 active:opacity-80"
        >
          <Text style={{ color: colors.abyss }} className="text-base font-bold">
            {last ? "Open the map" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
