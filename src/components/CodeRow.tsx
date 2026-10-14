import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { color, radius, type } from "../theme";

/** 설정집 행: 번호 칸 · 뜻 · 보조정보. 탭 = 복사, 길게 = 지우기 */
export function CodeRow({ code, meaning, used, top, status, byName, onPress, onLongPress, onConfirm }:
  { code: string; meaning: string; used: number; top?: boolean; status?: "confirmed" | "mine" | "theirs"; byName?: string; onPress: () => void; onLongPress: () => void; onConfirm?: () => void }) {
  const sub = status === "theirs" ? `${byName || "상대"}가 제안했어요` : status === "mine" ? "상대 확인 기다리는 중" : used ? `이번 달 ${used}번${top ? " · 가장 많이 씀" : ""}` : "아직 안 보냄";
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={500} style={({ pressed }) => [s.row, { opacity: pressed ? 0.8 : 1 }]}
      accessibilityLabel={`${code} ${meaning}, 탭하면 복사`}>
      <View style={[s.num, top && s.top, status && status !== "confirmed" && s.wait]}><Text style={[s.numTxt, top && { color: color.inkOnAccent }, status && status !== "confirmed" && { color: color.inkMuted }]}>{code}</Text></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.meaning} numberOfLines={1}>{meaning}</Text>
        <Text style={[s.sub, status === "theirs" && { color: color.accentInk }]}>{sub}</Text>
      </View>
      {status === "theirs" && onConfirm
        ? <Pressable onPress={onConfirm} style={s.ok} accessibilityLabel="이 코드 확인"><Text style={s.okTxt}>확인</Text></Pressable>
        : <Text style={{ color: color.inkFaint, fontSize: 16 }}>⧉</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: color.bg100, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 },
  num: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.bg200, alignItems: "center", justifyContent: "center" },
  top: { backgroundColor: color.accent },
  wait: { backgroundColor: "transparent", borderWidth: 1, borderStyle: "dashed", borderColor: color.line300 },
  ok: { height: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: color.accent, alignItems: "center", justifyContent: "center" },
  okTxt: { ...type.caption, fontFamily: type.label.fontFamily, color: color.inkOnAccent },
  numTxt: { ...type.codeLg, color: color.ink },
  meaning: { ...type.meaning, color: color.ink },
  sub: { ...type.micro, color: color.inkMuted },
});
