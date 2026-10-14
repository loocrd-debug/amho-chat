import React from "react";
import { Pressable, Text, View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { color, radius, space, type } from "../theme";

export function Button({ label, onPress, variant = "primary", style, disabled }:
  { label: string; onPress: () => void; variant?: "primary" | "ghost" | "danger"; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={({ pressed }) => [s.btn, variant === "ghost" && s.ghost, variant === "danger" && s.ghost, { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, style]}>
      <Text style={[s.btnTxt, variant !== "primary" && { color: variant === "danger" ? color.danger : color.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Eyebrow({ children }: { children: string }) { return <Text style={[type.label, { color: color.inkMuted }]}>{children}</Text>; }
export function Title({ children }: { children: string }) { return <Text style={[type.title, { color: color.ink }]}>{children}</Text>; }
export function Muted({ children, style }: { children: React.ReactNode; style?: any }) { return <Text style={[type.caption, { color: color.inkMuted }, style]}>{children}</Text>; }

export function Chip({ children, live }: { children: string; live?: boolean }) {
  return (
    <View style={s.chip}>
      {live !== undefined && <View style={[s.dot, { backgroundColor: live ? color.accent : color.line300 }]} />}
      <Text style={[type.caption, { color: color.inkMuted }]}>{children}</Text>
    </View>
  );
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <Pressable style={s.overlay} onPress={onClose}>
      <Pressable style={s.sheet} onPress={() => {}}>
        <View style={s.handle} />
        {children}
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { height: 50, paddingHorizontal: space.s5, borderRadius: radius.md, backgroundColor: color.ink, alignItems: "center", justifyContent: "center" },
  ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: color.line200 },
  btnTxt: { ...type.bodyStrong, fontSize: 16, color: color.inkOnInk },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: color.line200, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.overlay, justifyContent: "flex-end", zIndex: 5 },
  sheet: { backgroundColor: color.bg100, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.s5, paddingBottom: 34, gap: space.s4 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: color.line300, alignSelf: "center" },
});
