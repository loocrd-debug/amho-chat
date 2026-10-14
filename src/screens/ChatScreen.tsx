import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, TextInput, StyleSheet } from "react-native";
import { useStore } from "../lib/store";
import { color, radius, space, type } from "../theme";
import { CodeBubble } from "../components/CodeBubble";
import { Whisper } from "../components/Whisper";
import { CodeKey } from "../components/CodeKey";
import { Chip, Sheet, Button } from "../components/ui";

export function ChatScreen() {
  const { msgs, codes, codeList, sendCode, sendWhisper, burn, settings, partner } = useStore();
  const [text, setText] = useState("");
  const [all, setAll] = useState(false);
  const scroll = useRef<ScrollView>(null);
  useEffect(() => { scroll.current?.scrollToEnd({ animated: true }); }, [msgs.length]);
  const live = !!partner || settings.catAgent;
  const partnerName = partner ? partner.name : settings.catAgent ? "고양이 요원 (연습)" : settings.room ? "파트너를 기다리는 중" : "방이 없어요";
  const status = partner ? "접선 중" : settings.catAgent ? "연습 중 · 파트너 오면 자동 교대" : settings.room ? "자리 비움" : "접선 전";

  return (
    <View style={{ flex: 1 }}>
      <View style={s.top}>
        <Image source={require("../../assets/mascot/cat-flat.png")} style={s.avatar} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.heading, { color: color.ink }]}>{partnerName}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><View style={[s.dot, { backgroundColor: live ? color.accent : color.line300 }]} /><Text style={[type.caption, { color: color.inkMuted }]}>{status}</Text></View>
        </View>
        <Chip>10분 후 소멸</Chip>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={s.msgs}>
        {msgs.length === 0 && <Text style={s.sys}>신호를 보내면 여기에 나타나요 · 코드를 길게 누르면 뜻이 보여요</Text>}
        {msgs.map((m) => {
          const mine = m.from === settings.uid;
          if (m.type === "code") return <CodeBubble key={m.id} code={m.key} meaning={codes[m.key]?.meaning} mine={mine} at={m.at} lock={settings.lockReveal} />;
          return (
            <View key={m.id} style={[s.row, mine && { justifyContent: "flex-end" }]}>
              <Whisper text={m.text} mine={mine} lock={settings.lockReveal} onBurn={() => burn(m.id)} />
            </View>
          );
        })}
      </ScrollView>

      <View style={s.input}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {codeList.slice(0, 6).map((c) => <CodeKey key={c.key} chip code={c.key} meaning={c.meaning} onPress={() => sendCode(c.key)} />)}
          {codeList.length === 0 && <Text style={[type.caption, { color: color.inkMuted }]}>설정집에 코드를 먼저 만들어요</Text>}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Pressable onPress={() => setAll(true)} style={s.ibtn} accessibilityLabel="코드 전체 보기"><Text style={{ color: color.ink, fontSize: 18 }}>⊞</Text></Pressable>
          <TextInput value={text} onChangeText={setText} placeholder="귓속말 · 읽으면 사라져요" placeholderTextColor={color.inkFaint} maxLength={60} style={s.field}
            onSubmitEditing={() => { if (text.trim()) { sendWhisper(text.trim()); setText(""); } }} returnKeyType="send" />
          <Pressable onPress={() => { if (text.trim()) { sendWhisper(text.trim()); setText(""); } }} style={[s.ibtn, { backgroundColor: color.ink, borderColor: color.ink }]} accessibilityLabel="귓속말 보내기"><Text style={{ color: color.inkOnInk, fontSize: 18 }}>➤</Text></Pressable>
        </View>
      </View>

      <Sheet open={all} onClose={() => setAll(false)}>
        <Text style={[type.heading, { color: color.ink }]}>우리 코드</Text>
        <View style={s.grid}>{codeList.map((c) => <View key={c.key} style={{ width: "23%" }}><CodeKey code={c.key} meaning={c.meaning} onPress={() => { setAll(false); sendCode(c.key); }} /></View>)}</View>
        <Button label="닫기" variant="ghost" onPress={() => setAll(false)} />
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: space.s5, paddingTop: 14, paddingBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  msgs: { paddingHorizontal: space.s5, paddingVertical: 14, gap: 16 },
  sys: { ...type.micro, color: color.inkFaint, alignSelf: "center", letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "flex-end" },
  input: { gap: 10, paddingHorizontal: space.s4, paddingVertical: 10, borderTopWidth: 1, borderTopColor: color.line100 },
  ibtn: { width: 50, height: 50, borderWidth: 1, borderColor: color.line200, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  field: { flex: 1, height: 50, borderWidth: 1, borderColor: color.line200, borderRadius: radius.md, backgroundColor: color.bg100, color: color.ink, paddingHorizontal: 14, ...type.body, fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
