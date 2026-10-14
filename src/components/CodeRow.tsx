import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { color, radius, type } from "../theme";

/** 설정집 행: 번호 칸 · 뜻 · 보조정보. 탭 = 복사, 길게 = 지우기 */
export function CodeRow({ code, meaning, used, top, onPress, onLongPress }:
  { code: string; meaning: string; used: number; top?: boolean; onPress: () => void; onLongPress: () => void }) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={500} style={({ pressed }) => [s.row, { opacity: pressed ? 0.8 : 1 }]}
      accessibilityLabel={`${code} ${meaning}, 탭하면 복사`}>
      <View style={[s.num, top && s.top]}><Text style={[s.numTxt, top && { color: color.inkOnAccent }]}>{code}</Text></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.meaning} numberOfLines={1}>{meaning}</Text>
        <Text style={s.sub}>{used ? `이번 달 ${used}번${top ? " · 가장 많이 씀" : ""}` : "아직 안 보냄"}</Text>
      </View>
      <Text style={{ color: color.inkFaint, fontSize: 16 }}>⧉</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: color.bg100, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 },
  num: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.bg200, alignItems: "center", justifyContent: "center" },
  top: { backgroundColor: color.accent },
  numTxt: { ...type.codeLg, color: color.ink },
  meaning: { ...type.meaning, color: color.ink },
  sub: { ...type.micro, color: color.inkMuted },
});
