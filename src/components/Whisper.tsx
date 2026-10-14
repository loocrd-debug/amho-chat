import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, View, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { color, radius, type, REVEAL_MS } from "../theme";
import { unlockReveal } from "../lib/reveal";

/** 귓속말. 가려져 있다가 길게 누르면 2초 보이고 소멸한다. */
export function Whisper({ text, mine, lock, onBurn }: { text: string; mine: boolean; lock: boolean; onBurn: () => void }) {
  const [open, setOpen] = useState(false);
  const bar = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => { if (!open) return; Animated.timing(bar, { toValue: 0, duration: REVEAL_MS, useNativeDriver: false }).start(() => {
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(onBurn);
  }); }, [open]);
  const reveal = async () => { if (open || !(await unlockReveal(lock))) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(true); };
  const n = Math.min(text.length, 20);
  return (
    <Animated.View style={[s.wrap, mine && { alignItems: "flex-end" }, { opacity: fade }]}>
      <Pressable onLongPress={reveal} delayLongPress={400} style={[s.bub, open && s.open]} accessibilityLabel={open ? text : `가려진 귓속말 ${text.length}자, 길게 눌러 읽기`}>
        {open ? <Text style={s.txt}>{text}</Text> : <View style={s.blocks}>{Array.from({ length: n }).map((_, i) => <View key={i} style={s.block} />)}</View>}
      </Pressable>
      {open
        ? <View style={s.meta}><View style={s.barBg}><Animated.View style={[s.bar, { transform: [{ scaleX: bar }] }]} /></View><Text style={[s.metaTxt, { color: color.accentInk }]}>읽는 중 · 2초 후 사라짐</Text></View>
        : <Text style={s.metaTxt}>귓속말 {text.length}자 · 길게 눌러 읽기</Text>}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 6, alignItems: "flex-start", maxWidth: 290 },
  bub: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line300 },
  open: { backgroundColor: color.accent, borderColor: color.accent },
  txt: { ...type.bodyStrong, color: color.inkOnAccent },
  blocks: { flexDirection: "row", flexWrap: "wrap", gap: 3, maxWidth: 200 },
  block: { width: 12, height: 16, borderRadius: 3, backgroundColor: color.bg200 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 6 },
  metaTxt: { ...type.micro, color: color.inkFaint, paddingHorizontal: 6 },
  barBg: { width: 90, height: 3, borderRadius: 2, backgroundColor: color.line200, overflow: "hidden" },
  bar: { height: 3, backgroundColor: color.accentInk, width: 90, transformOrigin: "left" as any },
});
