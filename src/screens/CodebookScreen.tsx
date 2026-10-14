import React, { useState } from "react";
import { View, Text, ScrollView, Image, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useStore } from "../lib/store";
import { color, radius, space, type, FREE_SLOTS } from "../theme";
import { CodeRow } from "../components/CodeRow";
import { Button, Chip, Eyebrow, Title, Muted, Sheet } from "../components/ui";

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function CodebookScreen({ onToast }: { onToast: (t: string) => void }) {
  const { codeList, codes, addCode, removeCode, settings, partner } = useStore();
  const [adding, setAdding] = useState(false);
  const [expand, setExpand] = useState(false);
  const [key, setKey] = useState("");
  const [meaning, setMeaning] = useState("");
  const full = codeList.length >= settings.slots;

  const copy = async (k: string) => { await Clipboard.setStringAsync(k); onToast(`“${k}” 복사됨 · 카톡에 붙여넣기`); };
  const del = (k: string) => Alert.alert(`코드 ${k} 지우기`, `“${codes[k].meaning}”를 설정집에서 지워요.`, [{ text: "나중에", style: "cancel" }, { text: "지우기", style: "destructive", onPress: () => removeCode(k) }]);
  const save = () => { if (!key || !meaning.trim() || codes[key]) return; addCode(key, meaning.trim()); setAdding(false); setKey(""); setMeaning(""); onToast(`${key} = ${meaning.trim()} 저장`); };

  return (
    <View style={{ flex: 1 }}>
      <View style={s.top}>
        <View style={{ flex: 1, gap: 2 }}><Eyebrow>우리 설정집</Eyebrow><Title>{`${settings.name || "나"} × ${partner ? partner.name : settings.room ? "?" : settings.catAgent ? "고양이 요원" : "?"}`}</Title></View>
        <Chip>폰에만 저장</Chip>
      </View>
      <ScrollView contentContainerStyle={s.list}>
        <View style={s.note}><Image source={require("../../assets/mascot/cat-flat.png")} style={s.noteImg} /><Text style={s.noteTxt}>코드를 탭하면 복사돼요. 카톡이나 문자에 붙여넣기만 하세요. 길게 누르면 지워요.</Text></View>
        <View style={s.sub}><Muted>{`코드 ${codeList.length} / ${settings.slots}`}</Muted><Pressable onPress={() => setExpand(true)}><Text style={s.link}>칸 늘리기</Text></Pressable></View>
        {codeList.map((c, i) => <CodeRow key={c.key} code={c.key} meaning={c.meaning} used={c.used} top={i === 0 && c.used > 0} onPress={() => copy(c.key)} onLongPress={() => del(c.key)} />)}
        <Pressable onPress={() => (full ? setExpand(true) : setAdding(true))} style={s.empty}>
          <View style={s.emptyNum}><Text style={{ color: color.inkMuted, fontSize: 20 }}>+</Text></View>
          <Text style={[type.body, { color: color.inkMuted, fontSize: 14 }]}>새 코드 만들기</Text>
        </Pressable>
      </ScrollView>

      <Sheet open={adding} onClose={() => setAdding(false)}>
        <Text style={[type.heading, { color: color.ink }]}>새 코드</Text>
        <Eyebrow>코드 (숫자·알파벳, 최대 2자)</Eyebrow>
        <View style={s.pad}>
          {CHARS.map((ch) => (
            <Pressable key={ch} onPress={() => setKey((k) => (k.length >= 2 ? ch : k + ch))} style={[s.padKey, key.includes(ch) && { backgroundColor: color.accent, borderColor: color.accent }]}>
              <Text style={[type.codeMd, { color: key.includes(ch) ? color.inkOnAccent : color.ink }]}>{ch}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <View style={s.preview}><Text style={[type.codeLg, { color: color.ink }]}>{key || "?"}</Text></View>
          <TextInput value={meaning} onChangeText={setMeaning} placeholder="뜻 (예: 사랑해, 6자 이내 추천)" placeholderTextColor={color.inkFaint} maxLength={12} style={s.input} />
        </View>
        {codes[key] && <Muted>{`${key}는 이미 “${codes[key].meaning}”로 쓰고 있어요`}</Muted>}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button label="나중에" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
          <Button label="설정집에 넣기" onPress={save} disabled={!key || !meaning.trim() || !!codes[key]} style={{ flex: 2 }} />
        </View>
      </Sheet>

      <Sheet open={expand} onClose={() => setExpand(false)}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Image source={require("../../assets/mascot/cat-hooray.png")} style={{ width: 44, height: 44, borderRadius: 22 }} />
          <View style={{ flex: 1 }}><Text style={[type.heading, { color: color.ink }]}>{`암호가 ${FREE_SLOTS}칸을 다 찼어요`}</Text><Muted>둘만의 언어가 늘고 있다는 뜻이에요</Muted></View>
        </View>
        <View style={s.plan}><View style={{ flex: 1 }}><Text style={[type.bodyStrong, { color: color.ink }]}>+12칸</Text><Muted>숫자·알파벳 24칸까지</Muted></View><Text style={[type.body, { color: color.ink }]}>[가격]</Text></View>
        <View style={[s.plan, { borderColor: color.accent }]}><View style={{ flex: 1 }}><Text style={[type.bodyStrong, { color: color.ink }]}>무제한</Text><Muted>기호 코드, 작전팀 방, 테마 포함</Muted></View><Text style={[type.body, { color: color.ink }]}>[가격]</Text></View>
        <Muted style={{ textAlign: "center", fontSize: 11 }}>한 번 결제하면 파트너도 같이 늘어나요. 결제는 스토어 인앱 결제로 처리돼요.</Muted>
        <Button label="나중에 할게요" variant="ghost" onPress={() => setExpand(false)} />
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: space.s5, paddingTop: 14, paddingBottom: 10 },
  list: { paddingHorizontal: space.s5, paddingVertical: 12, gap: 8 },
  note: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: color.bg100, borderRadius: radius.md, padding: 12 },
  noteImg: { width: 36, height: 36, borderRadius: 18 },
  noteTxt: { ...type.caption, fontSize: 13, lineHeight: 18, color: "#C9C9CC", flex: 1 },
  sub: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2, paddingTop: 4 },
  link: { ...type.label, color: color.accentInk },
  empty: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderStyle: "dashed", borderColor: color.line300, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 },
  emptyNum: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: color.line300, alignItems: "center", justifyContent: "center" },
  pad: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  padKey: { width: "15%", height: 44, borderWidth: 1, borderColor: color.line200, borderRadius: radius.sm, backgroundColor: color.bg000, alignItems: "center", justifyContent: "center" },
  preview: { width: 48, height: 48, borderRadius: 12, backgroundColor: color.bg200, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, height: 50, borderWidth: 1, borderColor: color.line200, borderRadius: radius.md, backgroundColor: color.bg000, color: color.ink, paddingHorizontal: 14, ...type.body },
  plan: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: color.line200, borderRadius: 16, backgroundColor: color.bg000, padding: 14 },
});
