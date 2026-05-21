import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import WidgetPreview from "@/components/WidgetPreview";
import { FocusCategory, useFocus } from "@/context/FocusContext";
import { useColors } from "@/hooks/useColors";

const MAX_CHARS = 120;

const CATEGORIES: {
  key: FocusCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}[] = [
  {
    key: "focus",
    label: "Today's Focus",
    icon: "flash",
    description: "What matters most today",
  },
  {
    key: "goal",
    label: "Goal",
    icon: "flag",
    description: "Something you're working toward",
  },
  {
    key: "quote",
    label: "Quote",
    icon: "chatbubble-ellipses",
    description: "A reminder or inspiration",
  },
  {
    key: "reminder",
    label: "Reminder",
    icon: "alarm",
    description: "Don't forget this",
  },
];

const CATEGORY_COLORS: Record<FocusCategory, string> = {
  focus: "#4F46E5",
  goal: "#10B981",
  quote: "#7C3AED",
  reminder: "#F59E0B",
};

const SUGGESTIONS: Record<FocusCategory, string[]> = {
  focus: [
    "Finish the feature by EOD",
    "1 hour of deep work — no distractions",
    "Clear inbox and reply to all messages",
  ],
  goal: [
    "Ship MVP by end of month",
    "Run 3x this week",
    "Read for 20 minutes daily",
  ],
  quote: [
    "Done is better than perfect.",
    "Focus on progress, not perfection.",
    "One thing at a time.",
  ],
  reminder: [
    "Drink 8 glasses of water",
    "Take breaks every 90 minutes",
    "Stand up and stretch",
  ],
};

export default function EditScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { current, setFocus } = useFocus();
  const inputRef = useRef<TextInput>(null);

  const [text, setText] = useState(current?.text ?? "");
  const [category, setCategory] = useState<FocusCategory>(
    current?.category ?? "focus"
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const handleSave = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setFocus(text.trim(), category);
    setIsSaving(false);
    router.back();
  };

  const handleSuggestion = (s: string) => {
    setText(s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isValid = text.trim().length > 0 && text.length <= MAX_CHARS;
  const charsLeft = MAX_CHARS - text.length;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Nav bar */}
      <View
        style={[
          styles.navbar,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          Edit Focus
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={!isValid || isSaving}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: isValid ? colors.primary : colors.muted,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.saveBtnText,
              { color: isValid ? "#FFFFFF" : colors.mutedForeground },
            ]}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Text input */}
        <View style={styles.section}>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.card,
                borderColor:
                  text.length > MAX_CHARS ? colors.destructive : colors.border,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder="What's your focus today?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={MAX_CHARS + 20}
              style={[styles.textInput, { color: colors.foreground }]}
              returnKeyType="default"
            />
            <View style={styles.inputFooter}>
              {text.length > 0 && (
                <TouchableOpacity onPress={() => setText("")} hitSlop={10}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}
              <Text
                style={[
                  styles.charCount,
                  {
                    color:
                      charsLeft < 20
                        ? charsLeft < 0
                          ? colors.destructive
                          : colors.accent
                        : colors.mutedForeground,
                  },
                ]}
              >
                {charsLeft}
              </Text>
            </View>
          </View>
        </View>

        {/* Category picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            CATEGORY
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => {
                  setCategory(cat.key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [
                  styles.categoryCard,
                  {
                    backgroundColor:
                      category === cat.key
                        ? CATEGORY_COLORS[cat.key] + "18"
                        : colors.card,
                    borderColor:
                      category === cat.key
                        ? CATEGORY_COLORS[cat.key]
                        : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={cat.icon}
                  size={20}
                  color={
                    category === cat.key
                      ? CATEGORY_COLORS[cat.key]
                      : colors.mutedForeground
                  }
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color:
                        category === cat.key
                          ? CATEGORY_COLORS[cat.key]
                          : colors.foreground,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
                <Text
                  style={[
                    styles.categoryDesc,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {cat.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Suggestions */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            SUGGESTIONS
          </Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS[category].map((s, i) => (
              <Pressable
                key={i}
                onPress={() => handleSuggestion(s)}
                style={({ pressed }) => [
                  styles.suggestionChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[styles.suggestionText, { color: colors.foreground }]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Live preview */}
        {text.trim().length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              WIDGET PREVIEW
            </Text>
            <View style={styles.previewWrapper}>
              <WidgetPreview
                item={{
                  id: "preview",
                  text: text.trim(),
                  category,
                  createdAt: Date.now(),
                }}
                size="medium"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  inputContainer: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 100,
  },
  textInput: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    flex: 1,
    minHeight: 72,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    width: "47%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  categoryDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
  suggestions: {
    gap: 8,
  },
  suggestionChip: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  previewWrapper: {
    alignItems: "center",
    paddingVertical: 4,
  },
});
