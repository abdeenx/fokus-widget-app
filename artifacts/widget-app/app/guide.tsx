import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import WidgetPreview from "@/components/WidgetPreview";
import { useFocus } from "@/context/FocusContext";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  {
    number: "1",
    icon: "hand-left" as const,
    title: "Long-press your home screen",
    detail:
      "Press and hold on an empty area of your home screen until the icons start jiggling.",
    tip: 'Look for a "+" button in the top-left corner.',
  },
  {
    number: "2",
    icon: "add-circle" as const,
    title: 'Tap the "+" button',
    detail:
      "This opens the widget gallery where you can browse and add widgets from any of your installed apps.",
    tip: null,
  },
  {
    number: "3",
    icon: "search" as const,
    title: 'Search for "Fokus"',
    detail:
      'Type "Fokus" in the search bar at the top of the widget gallery to find the widget.',
    tip: "The widget requires a production build via Expo Launch.",
  },
  {
    number: "4",
    icon: "phone-portrait" as const,
    title: "Choose your widget size",
    detail:
      "Fokus supports three sizes: Small (2×2), Medium (4×2), and Large (4×4). Swipe left/right to preview each size.",
    tip: null,
  },
  {
    number: "5",
    icon: "add" as const,
    title: 'Tap "Add Widget"',
    detail:
      "Tap the button to add it, then drag it to the perfect spot on your home screen.",
    tip: null,
  },
  {
    number: "6",
    icon: "checkmark-circle" as const,
    title: "Done!",
    detail:
      "Your Fokus widget will now show your current focus. Update it anytime from the app and the widget refreshes automatically.",
    tip: null,
  },
];

export default function GuideScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { current } = useFocus();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Add to Home Screen
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Your focus, always visible
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Add Fokus to your iPhone home screen and see your daily focus
            without opening the app.
          </Text>

          <View style={styles.widgetShowcase}>
            <WidgetPreview item={current} size="medium" />
          </View>
        </View>

        {/* Requirement banner */}
        <View
          style={[
            styles.requirementBanner,
            { backgroundColor: "#F59E0B18", borderColor: "#F59E0B40" },
          ]}
        >
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text
            style={[styles.requirementText, { color: colors.foreground }]}
          >
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              Native build required.{" "}
            </Text>
            Widgets work on physical devices after publishing via{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>
              Expo Launch
            </Text>
            . Use the preview in the app to see how your widget looks.
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <Text style={[styles.stepsTitle, { color: colors.foreground }]}>
            Step-by-step guide
          </Text>

          {STEPS.map((step, index) => (
            <View
              key={step.number}
              style={[
                styles.stepCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.stepLeft}>
                <View
                  style={[styles.stepNumber, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                {index < STEPS.length - 1 && (
                  <View
                    style={[styles.stepLine, { backgroundColor: colors.border }]}
                  />
                )}
              </View>

              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Ionicons
                    name={step.icon}
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.stepTitle, { color: colors.foreground }]}
                  >
                    {step.title}
                  </Text>
                </View>
                <Text
                  style={[styles.stepDetail, { color: colors.mutedForeground }]}
                >
                  {step.detail}
                </Text>
                {step.tip && (
                  <View
                    style={[
                      styles.tipBadge,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Ionicons
                      name="bulb-outline"
                      size={12}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.tipText, { color: colors.primary }]}
                    >
                      {step.tip}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => router.push("/edit")}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="pencil" size={18} color="#FFFFFF" />
          <Text style={styles.ctaText}>
            {current ? "Update Your Focus" : "Set Your First Focus"}
          </Text>
        </Pressable>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 20,
    gap: 20,
  },
  hero: {
    alignItems: "center",
    gap: 10,
    paddingTop: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 16,
  },
  widgetShowcase: {
    marginTop: 8,
    alignItems: "center",
  },
  requirementBanner: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  requirementText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  stepsContainer: {
    gap: 0,
  },
  stepsTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  stepCard: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
    paddingRight: 14,
    borderRadius: 0,
    borderWidth: 0,
  },
  stepLeft: {
    alignItems: "center",
    width: 28,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    marginBottom: -6,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 12,
    gap: 6,
  },
  stepTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  stepDetail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  tipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  tipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
