// 초대: 방 ID(12자) + 귓속말 키(32바이트)를 상대 폰에 넘긴다.
//  - QR / 링크: amho://join?r=<room>&k=<key>  → 서버가 키를 전혀 보지 않는다
//  - 6자리 코드: invites 테이블에 10분만 맡긴다 → 편하지만 그 10분은 서버가 키를 안다 (설정에 명시)
import * as Linking from "expo-linking";
import { supabase } from "./supabase";
import { newKey, randomId } from "./crypto";

export type Room = { id: string; key: string };

export async function createRoom(uid: string, name: string): Promise<Room> {
  if (!supabase) throw new Error("서버 설정이 없어요");
  const room: Room = { id: randomId(12), key: newKey() };
  const { error } = await supabase.from("rooms").insert({ id: room.id });
  if (error) throw new Error(error.message);
  await supabase.from("room_members").upsert({ room_id: room.id, uid, name });
  return room;
}

export const inviteLink = (room: Room) => Linking.createURL("join", { queryParams: { r: room.id, k: room.key } });

export function parseInvite(url: string): Room | null {
  try { const { queryParams, path } = Linking.parse(url); if (!path?.endsWith("join")) return null;
    const r = String(queryParams?.r ?? ""), k = String(queryParams?.k ?? ""); return r && k ? { id: r, key: k } : null; } catch { return null; }
}

export async function createCode(room: Room): Promise<string> {
  if (!supabase) throw new Error("서버 설정이 없어요");
  const digits = Array.from({ length: 6 }, () => "0123456789"[Math.floor(Math.random() * 10)]).join("");
  const { error } = await supabase.from("invites").insert({ code: digits, room_id: room.id, key_b64: room.key, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
  if (error) throw new Error(error.message);
  return digits;
}

export async function redeemCode(code: string): Promise<Room | null> {
  if (!supabase) throw new Error("서버 설정이 없어요");
  const { data } = await supabase.from("invites").select("room_id, key_b64, expires_at").eq("code", code).maybeSingle();
  if (!data || Date.parse(data.expires_at) < Date.now()) return null;
  await supabase.from("invites").delete().eq("code", code); // 1회용
  return { id: data.room_id, key: data.key_b64 };
}

export async function joinRoom(room: Room, uid: string, name: string) {
  if (!supabase) throw new Error("서버 설정이 없어요");
  const { error } = await supabase.from("room_members").upsert({ room_id: room.id, uid, name, seen_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function leaveRoom(room: Room, uid: string) {
  await supabase?.from("room_members").delete().eq("room_id", room.id).eq("uid", uid);
}
