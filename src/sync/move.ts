// "서랍 옮기기": 이름·방·설정집을 링크 하나에 담아 다른 브라우저/홈 화면 앱으로 옮긴다.
// 내용은 주소의 # 뒤(fragment)에만 있어서 서버로 전송되지 않는다. 본인 폰 안에서만 복사·붙여넣기.
import { Platform } from "react-native";
import type { Code, Settings } from "../lib/types";

export type MovePack = { v: 1; name: string; uid: string; room: Settings["room"]; codes: { key: string; meaning: string }[] };

const enc = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dec = (u: string) => decodeURIComponent(escape(atob(u.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (u.length % 4)) % 4))));

export function moveToken(settings: Settings, codes: Record<string, Code>) {
  const pack: MovePack = { v: 1, name: settings.name, uid: settings.uid, room: settings.room, codes: Object.values(codes).map((c) => ({ key: c.key, meaning: c.meaning })) };
  return "m-" + enc(JSON.stringify(pack));
}

export function moveLink(settings: Settings, codes: Record<string, Code>) {
  const t = moveToken(settings, codes);
  return Platform.OS === "web" && typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}#${t}` : `amho://move#${t}`;
}

export function parseMove(text: string): MovePack | null {
  const m = text.match(/m-([A-Za-z0-9_-]{20,})/);
  if (!m) return null;
  try { const p = JSON.parse(dec(m[1])); return p && p.v === 1 && typeof p.name === "string" ? p : null; } catch { return null; }
}
