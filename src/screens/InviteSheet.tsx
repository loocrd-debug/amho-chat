import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useStore } from "../lib/store";
import { color, radius, type } from "../theme";
import { Button, Eyebrow, Muted, Sheet } from "../components/ui";
import { createCode, inviteLink, type Room } from "../sync/invite";

/** 초대 만들기: QR + 링크 공유 + 6자리 코드 */
export function InviteSheet({ open, onClose, onToast }: { open: boolean; onClose: () => void; onToast: (t: string) => void }) {
  const { settings, startRoom } = useStore();
  const [room, setRoom] = useState<Room | null>(settings.room);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open && !room) { setBusy(true); startRoom().then(setRoom).catch((e) => onToast(e.message)).finally(() => setBusy(false)); } }, [open]);
  const link = room ? inviteLink(room) : "";

  return (
    <Sheet open={open} onClose={onClose}>
      <Text style={[type.heading, { color: color.ink }]}>설정집을 넘길 사람</Text>
      <Muted>상대가 이 링크를 열고 이름만 적으면 같은 방이에요. 뜻은 서버를 거치지 않아요.</Muted>
      <View style={s.qr}>{room ? <QRCode value={link} size={188} backgroundColor={color.ink} color={color.bg000} /> : <Muted>{busy ? "방을 만드는 중" : "서버 설정이 필요해요"}</Muted>}</View>
      <View style={{ gap: 8 }}>
        <Eyebrow>내 초대 링크</Eyebrow>
        <Text selectable numberOfLines={2} style={[type.caption, { color: color.inkMuted }]}>{link || "준비 중"}</Text>
        <Button label="링크 복사 → 카톡에 붙여넣기" onPress={async () => { await Clipboard.setStringAsync(link); onToast("복사했어요. 카톡에 붙여넣어 보내세요"); }} disabled={!room} style={{ height: 54 }} />
      </View>
      <View style={{ alignItems: "center", gap: 8 }}>
        <Muted>또는 6자리 코드 · 10분 동안만 · 1회용</Muted>
        {code ? <Text style={s.code}>{code.slice(0, 3)} {code.slice(3)}</Text>
          : <Pressable onPress={() => room && createCode(room).then(setCode).catch((e) => onToast(e.message))}><Text style={[type.label, { color: color.accentInk }]}>코드 만들기</Text></Pressable>}
        {code && <Muted style={{ fontSize: 11 }}>코드 방식은 10분 동안 서버가 귓속말 키를 맡아요. QR이 더 비밀스러워요.</Muted>}
      </View>
      <Button label="닫기" variant="ghost" onPress={onClose} />
    </Sheet>
  );
}

/** 초대 받기: QR 스캔 또는 6자리 입력 */
export function JoinSheet({ open, onClose, onToast }: { open: boolean; onClose: () => void; onToast: (t: string) => void }) {
  const { joinByLink, joinByCode } = useStore();
  const [perm, ask] = useCameraPermissions();
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [scanning, setScanning] = useState(false);
  const done = (ok: boolean) => { if (ok) { onToast("접선 완료. 같은 방이에요"); onClose(); } else onToast("초대를 찾지 못했어요"); };

  return (
    <Sheet open={open} onClose={onClose}>
      <Text style={[type.heading, { color: color.ink }]}>초대 받기</Text>
      {scanning && perm?.granted ? (
        <View style={s.cam}><CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={({ data }) => { setScanning(false); joinByLink(data).then(done); }} /></View>
      ) : (
        <Button label="QR 찍기" variant="ghost" onPress={async () => { const p = perm?.granted ? perm : await ask(); if (p?.granted) setScanning(true); else onToast("카메라 권한이 필요해요"); }} />
      )}
      <Eyebrow>초대 링크 붙여넣기</Eyebrow>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput value={link} onChangeText={setLink} autoCapitalize="none" autoCorrect={false} placeholder="초대 링크 또는 옮기기 링크를 통째로 붙여넣기" placeholderTextColor={color.inkFaint} style={[s.input, { letterSpacing: 0, textAlign: "left", fontSize: 13 }]} />
        <Button label="접선" onPress={() => joinByLink(link).then(done)} disabled={link.length < 20} />
      </View>
      <Eyebrow>또는 6자리 코드</Eyebrow>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput value={code} onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" placeholder="000000" placeholderTextColor={color.inkFaint} style={s.input} maxLength={6} />
        <Button label="접선" onPress={() => joinByCode(code).then(done)} disabled={code.length < 6} />
      </View>
      <Button label="닫기" variant="ghost" onPress={onClose} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  qr: { alignSelf: "center", width: 220, height: 220, borderRadius: radius.lg, backgroundColor: color.ink, alignItems: "center", justifyContent: "center" },
  code: { ...type.title, fontSize: 32, letterSpacing: 4, color: color.ink },
  cam: { height: 220, borderRadius: radius.lg, overflow: "hidden", backgroundColor: color.bg000 },
  input: { flex: 1, minWidth: 0, height: 50, borderWidth: 1, borderColor: color.line200, borderRadius: radius.md, backgroundColor: color.bg000, color: color.ink, paddingHorizontal: 14, ...type.codeLg, letterSpacing: 6, textAlign: "center" },
});
