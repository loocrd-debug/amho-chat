import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, type } from "../theme";

export type Tab = "book" | "chat" | "settings";
const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: "book", label: "설정집", glyph: "▤" },
  { id: "chat", label: "비밀 채팅", glyph: "◯" },
  { id: "settings", label: "설정", glyph: "⚙" },
];

/** 하단 탭. 설정집이 첫 번째. 배지는 숫자 없이 점만. */
export function TabBar({ current, onChange, badge }: { current: Tab; onChange: (t: Tab) => void; badge?: boolean }) {
  const inset = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(inset.bottom, 12) }]}>
      {TABS.map((t) => {
        const on = t.id === current;
        return (
          <Pressable key={t.id} onPress={() => onChange(t.id)} style={s.tab} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            {t.id === "chat" && badge && !on && <View style={s.badge} />}
            <Text style={[s.glyph, on && { color: color.accentInk }]}>{t.glyph}</Text>
            <Text style={[s.label, on && { color: color.accentInk, fontFamily: type.label.fontFamily }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: "row", justifyContent: "space-around", paddingTop: 8, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: color.line100, backgroundColor: color.bg000 },
  tab: { width: 80, alignItems: "center", gap: 4, paddingVertical: 6 },
  glyph: { fontSize: 20, color: color.inkFaint },
  label: { ...type.caption, color: color.inkFaint },
  badge: { position: "absolute", top: 4, right: 22, width: 8, height: 8, borderRadius: 4, backgroundColor: color.accent },
});
