import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, View, StyleSheet, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { color, radius, type, REVEAL_MS } from "../theme";
import { unlockReveal } from "../lib/reveal";

function hhmm(t: number) { const d = new Date(t); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }

/** 코드 말풍선. 길게 누르면 뜻이 2초 떠올랐다 사라진다. */
export function CodeBubble({ code, meaning, mine, at, lock }: { code: string; meaning?: string; mine: boolean; at: number; lock: boolean }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const reveal = async () => {
    if (!(await unlockReveal(lock))) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true); timer.current = setTimeout(() => setOpen(false), REVEAL_MS);
  };
  return (
    <View style={[s.row, mine && s.rowMine]}>
      {mine && <Text style={s.time}>{hhmm(at)}</Text>}
      <View>
        {open && <View style={[s.reveal, mine ? { right: 0 } : { left: 0 }]}><Text style={s.revealTxt}>{meaning ?? "설정집에 없는 코드"}</Text></View>}
        <Pressable onLongPress={reveal} delayLongPress={400} style={[s.bub, mine && s.bubMine]} accessibilityLabel={`코드 ${code}, 길게 눌러 해독`}>
          <Text style={[s.code, mine && { color: color.inkOnInk }, code.length > 1 && { letterSpacing: 6 }]}>{code}</Text>
        </Pressable>
      </View>
      {!mine && <Text style={s.time}>{hhmm(at)}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  rowMine: { justifyContent: "flex-end" },
  bub: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: radius.lg, borderWidth: 1, borderColor: color.line300 },
  bubMine: { backgroundColor: color.ink, borderColor: color.ink },
  code: { ...type.codeXl, color: color.ink },
  time: { ...type.micro, color: color.inkFaint },
  reveal: { position: "absolute", bottom: "100%", marginBottom: 6, backgroundColor: color.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.md, zIndex: 2 },
  revealTxt: { ...type.bodyStrong, fontSize: 14, color: color.inkOnAccent },
});
