import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { FocusCategory, FocusItem } from "@/context/FocusContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  item: FocusItem;
  onPress: (item: FocusItem) => void;
  onDelete: (id: string) => void;
  isActive?: boolean;
}

const CATEGORY_META: Record<
  FocusCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  focus: { icon: "flash", color: "#4F46E5" },
  quote: { icon: "chatbubble-ellipses", color: "#7C3AED" },
  goal: { icon: "flag", color: "#10B981" },
  reminder: { icon: "alarm", color: "#F59E0B" },
};

export default function HistoryItem({ item, onPress, onDelete, isActive }: Props) {
  const colors = useColors();
  const meta = CATEGORY_META[item.category];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(item.id);
  };

  const formatRelativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isActive ? colors.secondary : colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: meta.color + "18" },
        ]}
      >
        <Ionicons name={meta.icon} size={16} color={meta.color} />
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[styles.itemText, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {item.text}
        </Text>
        <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
          {formatRelativeTime(item.createdAt)}
        </Text>
      </View>

      {isActive && (
        <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      )}

      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} hitSlop={12}>
        <Ionicons name="trash-outline" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  itemText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  timeText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  activeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  deleteButton: {
    padding: 4,
  },
});
