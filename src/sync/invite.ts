// 초대: 방 ID(12자) + 귓속말 키(32바이트)를 상대 폰에 넘긴다.
//  - QR / 링크: amho://join?r=<room>&k=<key>  → 서버가 키를 전혀 보지 않는다
//  - 6자리 코드: invites 테이블에 10분만 맡긴다 → 편하지만 그 10분은 서버가 키를 안다 (설정에 명시)
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { supabase as sb } from "./supabase";
import { newKey, randomId } from "./crypto";

export type Room = { id: string; key: string };

export async function createRoom(uid: string, name: string): Promise<Room> {
  if (!sb()) throw new Error("서버 설정이 없어요");
  const room: Room = { id: randomId(12), key: newKey() };
  // 테이블이 아직 없어도(SQL 전) 방은 만들어진다: 실시간 중계(Broadcast)만으로 동작
  await sb()!.from("rooms").insert({ id: room.id }).then(() => {}, () => {});
  await sb()!.from("room_members").upsert({ room_id: room.id, uid, name }).then(() => {}, () => {});
  return room;
}

// 초대 토큰: j-<방ID 12자>-<키 base64url 43자>. 웹에서는 주소 뒤 #토큰으로 붙는다.
const b64url = (b64: string) => b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64std = (u: string) => u.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (u.length % 4)) % 4);
export const inviteToken = (room: Room) => `j-${room.id}-${b64url(room.key)}`;

export const inviteLink = (room: Room) =>
  Platform.OS === "web" && typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}#${inviteToken(room)}`
    : Linking.createURL("join", { queryParams: { r: room.id, k: room.key } });

export function parseInvite(text: string): Room | null {
  const m = text.match(/j-([A-Z2-9]{12})-([A-Za-z0-9_-]{43})/);
  if (m) return { id: m[1], key: b64std(m[2]) };
  try { const { queryParams, path } = Linking.parse(text); if (!path?.endsWith("join")) return null;
    const r = String(queryParams?.r ?? ""), k = String(queryParams?.k ?? ""); return r && k ? { id: r, key: k } : null; } catch { return null; }
}

export async function createCode(room: Room): Promise<string> {
  if (!sb()) throw new Error("서버 설정이 없어요");
  const digits = Array.from({ length: 6 }, () => "0123456789"[Math.floor(Math.random() * 10)]).join("");
  const { error } = await sb()!.from("invites").insert({ code: digits, room_id: room.id, key_b64: room.key, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
  if (error) throw new Error("6자리 코드는 서버 테이블(SQL)을 만든 뒤에 돼요. QR이나 링크 초대를 쓰세요");
  return digits;
}

export async function redeemCode(code: string): Promise<Room | null> {
  if (!sb()) throw new Error("서버 설정이 없어요");
  const { data } = await sb()!.from("invites").select("room_id, key_b64, expires_at").eq("code", code).maybeSingle();
  if (!data || Date.parse(data.expires_at) < Date.now()) return null;
  await sb()!.from("invites").delete().eq("code", code); // 1회용
  return { id: data.room_id, key: data.key_b64 };
}

export async function joinRoom(room: Room, uid: string, name: string) {
  if (!sb()) throw new Error("서버 설정이 없어요");
  await sb()!.from("room_members").upsert({ room_id: room.id, uid, name, seen_at: new Date().toISOString() }).then(() => {}, () => {});
}

export async function leaveRoom(room: Room, uid: string) {
  await sb()?.from("room_members").delete().eq("room_id", room.id).eq("uid", uid);
}
