import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { color, radius, type } from "../theme";

/** 키패드 버튼(세로) / 빠른 답장 칩(가로) */
export function CodeKey({ code, meaning, onPress, chip, selected }: { code: string; meaning: string; onPress: () => void; chip?: boolean; selected?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={`${code} ${meaning} 보내기`}
      style={({ pressed }) => [chip ? s.chip : s.key, selected && s.on, { opacity: pressed ? 0.8 : 1 }]}>
      <Text style={[chip ? s.codeMd : s.codeLg, selected && { color: color.inkOnAccent }]}>{code}</Text>
      <Text style={[chip ? s.capChip : s.cap, selected && { color: color.inkOnAccent }]}>{meaning}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  key: { height: 56, borderWidth: 1, borderColor: color.line200, borderRadius: radius.md, backgroundColor: color.bg100, alignItems: "center", justifyContent: "center", gap: 2 },
  chip: { height: 44, paddingHorizontal: 16, borderWidth: 1, borderColor: color.line200, borderRadius: radius.pill, backgroundColor: color.bg100, flexDirection: "row", alignItems: "center", gap: 8 },
  on: { backgroundColor: color.accent, borderColor: color.accent },
  codeLg: { ...type.codeLg, color: color.ink },
  codeMd: { ...type.codeMd, color: color.ink },
  cap: { ...type.micro, color: color.inkMuted },
  capChip: { ...type.caption, color: color.inkMuted },
});
