import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HistoryItem from "@/components/HistoryItem";
import WidgetPreview, { WidgetSize } from "@/components/WidgetPreview";
import { FocusCategory, FocusItem, useFocus } from "@/context/FocusContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_FILTERS: { key: FocusCategory | "all"; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "all", label: "All", icon: "grid-outline" },
  { key: "focus", label: "Focus", icon: "flash-outline" },
  { key: "quote", label: "Quote", icon: "chatbubble-ellipses-outline" },
  { key: "goal", label: "Goal", icon: "flag-outline" },
  { key: "reminder", label: "Reminder", icon: "alarm-outline" },
];

const SIZE_OPTIONS: { key: WidgetSize; label: string }[] = [
  { key: "small", label: "S" },
  { key: "medium", label: "M" },
  { key: "large", label: "L" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { current, history, setFocus, deleteFocusItem } = useFocus();
  const [activeFilter, setActiveFilter] = useState<FocusCategory | "all">("all");
  const [previewSize, setPreviewSize] = useState<WidgetSize>("medium");

  const filteredHistory =
    activeFilter === "all"
      ? history
      : history.filter((h) => h.category === activeFilter);

  const handleSetFromHistory = async (item: FocusItem) => {
    await setFocus(item.text, item.category);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.brandName, { color: colors.primary }]}>fokus</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push("/guide")}
            style={styles.headerBtn}
            hitSlop={10}
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={styles.headerBtn}
            hitSlop={10}
          >
            <Ionicons name="settings-outline" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Widget preview section */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Widget Preview
            </Text>
            <View style={[styles.sizeToggle, { backgroundColor: colors.muted }]}>
              {SIZE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setPreviewSize(opt.key)}
                  style={[
                    styles.sizeBtn,
                    previewSize === opt.key && {
                      backgroundColor: colors.card,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sizeBtnText,
                      {
                        color:
                          previewSize === opt.key
                            ? colors.primary
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.previewContainer}>
            <WidgetPreview item={current} size={previewSize} />
          </View>

          {!current && (
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              Set your first focus to see it here
            </Text>
          )}
        </View>

        {/* Primary CTA */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/edit");
          }}
          style={({ pressed }) => [
            styles.editCta,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="pencil" size={18} color="#FFFFFF" />
          <Text style={styles.editCtaText}>
            {current ? "Update Focus" : "Set Your Focus"}
          </Text>
        </Pressable>

        {/* Add to home screen banner */}
        <Pressable
          onPress={() => router.push("/guide")}
          style={[styles.guideBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.guideBannerIcon, { backgroundColor: "#F59E0B18" }]}>
            <Ionicons name="phone-portrait-outline" size={20} color="#F59E0B" />
          </View>
          <View style={styles.guideBannerText}>
            <Text style={[styles.guideBannerTitle, { color: colors.foreground }]}>
              Add to Home Screen
            </Text>
            <Text style={[styles.guideBannerSub, { color: colors.mutedForeground }]}>
              See your focus anytime, without opening the app
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </Pressable>

        {/* History section */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              History
            </Text>

            {/* Category filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={styles.filterRowContent}
            >
              {CATEGORY_FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setActiveFilter(f.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        activeFilter === f.key ? colors.primary : colors.card,
                      borderColor:
                        activeFilter === f.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={f.icon}
                    size={12}
                    color={activeFilter === f.key ? "#FFFFFF" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          activeFilter === f.key ? "#FFFFFF" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {filteredHistory.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onPress={handleSetFromHistory}
                onDelete={deleteFocusItem}
                isActive={item.id === current?.id}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerBtn: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  previewSection: {
    gap: 12,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  sizeToggle: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  sizeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  sizeBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  previewContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  emptyHint: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
  editCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  editCtaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  guideBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  guideBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  guideBannerText: {
    flex: 1,
    gap: 2,
  },
  guideBannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  guideBannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  historySection: {
    gap: 10,
  },
  filterRow: {
    marginHorizontal: -20,
  },
  filterRowContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
