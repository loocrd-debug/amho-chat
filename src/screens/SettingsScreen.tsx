import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TextInput, StyleSheet, Alert, Switch } from "react-native";
import { useStore } from "../lib/store";
import { color, radius, space, type } from "../theme";
import { Button, Eyebrow, Title, Muted, Chip } from "../components/ui";
import { InviteSheet, JoinSheet } from "./InviteSheet";
import * as Clipboard from "expo-clipboard";
import { inviteLink } from "../sync/invite";
import { checkServer } from "../sync/supabase";
import { APP_VERSION } from "../theme";

export function SettingsScreen({ onToast }: { onToast: (t: string) => void }) {
  const { settings, setSettings, burnAll, serverOn, serverCfg, setServer, clearServer, partner, leave, error } = useStore();
  const [name, setName] = useState(settings.name);
  const [srvUrl, setSrvUrl] = useState(serverCfg?.url ?? "");
  const [srvKey, setSrvKey] = useState(serverCfg?.key ?? "");
  const [srvOpen, setSrvOpen] = useState(!serverOn);
  const [invite, setInvite] = useState(false);
  const [join, setJoin] = useState(false);
  const room = settings.room;
  const [health, setHealth] = useState<{ ok: boolean; detail: string } | null>(null);
  useEffect(() => { let on = true; setHealth(null); checkServer().then((h) => on && setHealth(h)); return () => { on = false; }; }, [serverOn, serverCfg?.key]);

  return (
    <View style={{ flex: 1 }}>
      <View style={s.top}><View style={{ gap: 2 }}><Eyebrow>작전 설정</Eyebrow><Title>파트너와 방</Title></View></View>
      <ScrollView contentContainerStyle={s.list}>
        <View style={s.center}>
          <Image source={require("../../assets/mascot/cat-envelope.png")} style={s.hero} />
          {room ? (
            <>
              <Text style={[type.heading, { color: color.ink }]}>{partner ? `${partner.name}와 접선 중` : "파트너를 기다리는 중"}</Text>
              <Chip live={!!partner}>{partner ? "접선 중" : "아직 안 들어옴"}</Chip>
              <Muted>{`방 번호 ${room.id.slice(-4)} · 상대 화면에도 같은 번호여야 해요`}</Muted>
              <Muted style={{ textAlign: "center" }}>아래 버튼으로 링크를 복사해 카톡으로 보내세요. 상대가 열고 이름을 적으면 여기 이름이 떠요.</Muted>
            </>
          ) : (
            <>
              <Text style={[type.heading, { color: color.ink }]}>설정집을 넘길 사람</Text>
              <Muted style={{ textAlign: "center", fontSize: 14, lineHeight: 20 }}>{serverOn ? "한 명이면 둘만의 방, 여러 명이면 작전팀이 돼요." : "아래 \"서버 연결\"에 주소와 키를 넣으면 초대가 켜져요. 지금은 연습 모드."}</Muted>
            </>
          )}
        </View>
        {room ? (
          <View style={{ gap: 8 }}>
            {!partner && <Button label="내 초대 링크 복사 → 카톡에 붙여넣기" onPress={async () => { await Clipboard.setStringAsync(inviteLink(room)); onToast("복사했어요. 카톡에 붙여넣어 보내세요"); }} style={{ height: 54 }} />}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button label="QR 보기" variant="ghost" onPress={() => setInvite(true)} style={{ flex: 1 }} />
              <Button label="초대 받기" variant="ghost" onPress={() => setJoin(true)} style={{ flex: 1 }} />
            </View>
            <Button label="방 나가기" variant="danger" onPress={() => Alert.alert("방 나가기", "이 방의 신호가 더 오지 않아요. 설정집은 폰에 남아요.", [{ text: "나중에", style: "cancel" }, { text: "나가기", style: "destructive", onPress: () => leave().then(() => onToast("방을 나왔어요")) }])} />
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button label="초대 만들기" onPress={() => setInvite(true)} disabled={!serverOn} style={{ flex: 1, height: 54 }} />
            <Button label="초대 받기" variant="ghost" onPress={() => setJoin(true)} disabled={!serverOn} style={{ flex: 1, height: 54 }} />
          </View>
        )}
        {error && <Muted style={{ color: color.danger }}>{error}</Muted>}

        <Eyebrow>서버 연결</Eyebrow>
        {serverOn && !srvOpen ? (
          <View style={s.row}><View style={{ flex: 1 }}><Text style={[type.body, { color: color.ink }]}>{health ? (health.ok ? "연결됨 · " : "문제 있음 · ") + health.detail : "확인 중…"}</Text><Muted>{serverCfg?.url}</Muted></View><Button label="바꾸기" variant="ghost" onPress={() => setSrvOpen(true)} style={{ height: 40 }} /></View>
        ) : (
          <View style={{ gap: 8 }}>
            <Muted>Supabase 대시보드 상단 Connect 버튼 → .env.local 칸의 복사 아이콘을 누른 뒤, 아래 아무 칸에나 통째로 붙여넣고 연결을 누르면 돼요.</Muted>
            <TextInput value={srvUrl} onChangeText={setSrvUrl} autoCapitalize="none" autoCorrect={false} placeholder="https://xxxx.supabase.co" placeholderTextColor={color.inkFaint} style={s.input} />
            <TextInput value={srvKey} onChangeText={setSrvKey} autoCapitalize="none" autoCorrect={false} placeholder="sb_publishable_... 또는 eyJ... (anon)" placeholderTextColor={color.inkFaint} style={s.input} secureTextEntry />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button label="연결" onPress={() => setServer(srvUrl, srvKey).then(() => { setSrvOpen(false); onToast("서버에 연결했어요"); }).catch((e) => onToast(e.message))} style={{ flex: 1, height: 44 }} />
              {serverOn && <Button label="끊기" variant="danger" onPress={() => clearServer().then(() => { setSrvUrl(""); setSrvKey(""); onToast("서버 연결을 끊었어요"); })} style={{ height: 44 }} />}
            </View>
          </View>
        )}

        <Eyebrow>내 이름</Eyebrow>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput value={name} onChangeText={setName} maxLength={10} placeholder="요원 이름" placeholderTextColor={color.inkFaint} style={s.input} />
          <Button label="저장" variant="ghost" onPress={() => { setSettings({ name: name.trim() }); onToast("이름을 바꿨어요"); }} style={{ height: 44 }} />
        </View>

        <Eyebrow>보안</Eyebrow>
        <Row title="해독할 때 지문·얼굴 확인" sub="켜면 뜻을 볼 때마다 생체 인증을 거쳐요" value={settings.lockReveal} onChange={(v) => setSettings({ lockReveal: v })} />

        <Eyebrow>연습 모드</Eyebrow>
        <Row title="고양이 요원이 대신 답장" sub="방이 없을 때 코드를 보내면 고양이가 답해요" value={settings.catAgent} onChange={(v) => setSettings({ catAgent: v })} />

        <Button label="대화 전부 소멸" variant="danger" onPress={() => Alert.alert("대화 전부 소멸", "지금까지의 신호와 귓속말이 모두 사라져요.", [{ text: "나중에", style: "cancel" }, { text: "소멸", style: "destructive", onPress: () => { burnAll(); onToast("전부 소멸했어요"); } }])} style={{ marginTop: 8 }} />
        <Muted style={{ textAlign: "center", fontSize: 11 }}>{`설정집과 뜻은 이 폰에만 저장돼요. 서버에는 숫자와 암호화된 귓속말만 10분 지나가요. · v${APP_VERSION}`}</Muted>
      </ScrollView>
      <InviteSheet open={invite} onClose={() => setInvite(false)} onToast={onToast} />
      <JoinSheet open={join} onClose={() => setJoin(false)} onToast={onToast} />
    </View>
  );
}

function Row({ title, sub, value, onChange }: { title: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}><Text style={[type.body, { color: color.ink }]}>{title}</Text><Muted>{sub}</Muted></View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: color.line300, true: color.accent }} thumbColor={color.ink} />
    </View>
  );
}

const s = StyleSheet.create({
  top: { paddingHorizontal: space.s5, paddingTop: 14, paddingBottom: 10 },
  list: { paddingHorizontal: space.s5, paddingVertical: 12, gap: 12 },
  center: { alignItems: "center", gap: 12, paddingVertical: 16 },
  hero: { width: 160, height: 160, borderRadius: radius.lg },
  input: { flex: 1, minWidth: 0, height: 44, borderWidth: 1, borderColor: color.line200, borderRadius: radius.md, backgroundColor: color.bg100, color: color.ink, paddingHorizontal: 14, ...type.body },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: color.bg100, borderRadius: radius.md, padding: 12 },
});
