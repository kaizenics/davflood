import { Ionicons } from "@expo/vector-icons";
import type { LngLat } from "@naboflood/hazard/geo";
import * as Location from "expo-location";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";

import { colors } from "@/lib/colors";

type Props = {
  onLocate: (center: LngLat) => void;
  onReset: () => void;
  terrain: boolean;
  onToggleTerrain: () => void;
};

/**
 * Locate / reset / terrain.
 *
 * Location permission is requested ONLY when the user taps locate — never on
 * launch. The marketing site promises "no permissions you have to think
 * about" and that promise is kept here.
 */
export function MapControls({
  onLocate,
  onReset,
  terrain,
  onToggleTerrain,
}: Props) {
  const [locating, setLocating] = useState(false);

  async function locate() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location is off",
          "NaboFlood works fine without it — you can still browse the whole map and search for your barangay.",
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onLocate([pos.coords.longitude, pos.coords.latitude]);
    } catch {
      Alert.alert("Couldn't get your location", "Try again in a moment.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <View className="gap-2">
      <ControlButton
        label="Show my location"
        onPress={locate}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator size="small" color={colors.tide} />
        ) : (
          <Ionicons name="locate" size={18} color={colors.ink} />
        )}
      </ControlButton>

      <ControlButton label="Reset the view" onPress={onReset}>
        <Ionicons name="refresh" size={18} color={colors.ink} />
      </ControlButton>

      <ControlButton
        label={terrain ? "Turn off 3D terrain" : "Turn on 3D terrain"}
        onPress={onToggleTerrain}
        active={terrain}
      >
        <Ionicons
          name="triangle"
          size={17}
          color={terrain ? colors.abyss : colors.ink}
        />
      </ControlButton>
    </View>
  );
}

function ControlButton({
  label,
  onPress,
  children,
  disabled,
  active,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={active ? { backgroundColor: colors.tide } : undefined}
      className="h-11 w-11 items-center justify-center rounded-full border border-hairline bg-abyss/90 active:opacity-70"
    >
      {children}
    </Pressable>
  );
}
