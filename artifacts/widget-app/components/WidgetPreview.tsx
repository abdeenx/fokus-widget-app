import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { FocusCategory, FocusItem } from "@/context/FocusContext";
import { useColors } from "@/hooks/useColors";

export type WidgetSize = "small" | "medium" | "large";

interface Props {
  item: FocusItem | null;
  size?: WidgetSize;
}

const CATEGORY_META: Record<
  FocusCategory,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  focus: { icon: "flash", label: "Today's Focus" },
  quote: { icon: "chatbubble-ellipses", label: "Quote" },
  goal: { icon: "flag", label: "Goal" },
  reminder: { icon: "alarm", label: "Reminder" },
};

const WIDGET_SIZES: Record<WidgetSize, { width: number; height: number }> = {
  small: { width: 155, height: 155 },
  medium: { width: 329, height: 155 },
  large: { width: 329, height: 345 },
};

export default function WidgetPreview({ item, size = "medium" }: Props) {
  const colors = useColors();
  const dims = WIDGET_SIZES[size];
  const meta = CATEGORY_META[item?.category ?? "focus"];
  const displayText = item?.text ?? "Set your daily focus";

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (size === "small") {
    return (
      <LinearGradient
        colors={["#4F46E5", "#3730A3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.widgetBase,
          { width: dims.width, height: dims.height, borderRadius: 22 },
        ]}
      >
        <View style={styles.smallContent}>
          <View style={styles.smallIconRow}>
            <Ionicons name={meta.icon} size={20} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.smallText} numberOfLines={5}>
            {displayText}
          </Text>
          <Text style={styles.widgetBrand}>fokus</Text>
        </View>
      </LinearGradient>
    );
  }

  if (size === "large") {
    return (
      <LinearGradient
        colors={["#4F46E5", "#1E1B4B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.widgetBase,
          { width: dims.width, height: dims.height, borderRadius: 22 },
        ]}
      >
        <View style={styles.largeContent}>
          <View style={styles.largeHeader}>
            <Text style={styles.widgetBrand}>fokus</Text>
            <View style={styles.categoryPill}>
              <Ionicons name={meta.icon} size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.categoryPillText}>{meta.label.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.largeText} numberOfLines={8}>
            {displayText}
          </Text>
          <Text style={styles.widgetDateLarge}>
            {item ? formatDate(item.createdAt) : "Today"}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#4F46E5", "#3730A3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.widgetBase,
        { width: dims.width, height: dims.height, borderRadius: 22 },
      ]}
    >
      <View style={styles.mediumContent}>
        <View style={styles.mediumLeft}>
          <View style={styles.mediumIconCircle}>
            <Ionicons name={meta.icon} size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.mediumCategoryLabel}>{meta.label.toUpperCase()}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.mediumRight}>
          <Text style={styles.mediumText} numberOfLines={4}>
            {displayText}
          </Text>
          <Text style={styles.widgetDate}>
            {item ? formatDate(item.createdAt) : "Today"}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  widgetBase: {
    overflow: "hidden",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },

  // Small
  smallContent: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  smallIconRow: {
    alignSelf: "flex-start",
  },
  smallText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    flex: 1,
    paddingVertical: 6,
  },
  widgetBrand: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },

  // Medium
  mediumContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  mediumLeft: {
    width: 64,
    alignItems: "center",
    gap: 6,
  },
  mediumIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediumCategoryLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 8,
  },
  mediumRight: {
    flex: 1,
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: 4,
  },
  mediumText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 21,
    flex: 1,
  },
  widgetDate: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },

  // Large
  largeContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  largeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryPillText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  largeText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
    flex: 1,
    paddingVertical: 16,
  },
  widgetDateLarge: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
