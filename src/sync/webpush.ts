// 웹 푸시(홈 화면 앱용). 구독 정보를 push_subs 테이블에 두면 서버 함수(notify)가 숫자만 담아 보낸다.
import { Platform } from "react-native";
import { supabase as sb } from "./supabase";

const VAPID = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || "";
const base = () => (typeof window !== "undefined" ? window.location.pathname.replace(/[^/]*$/, "") : "/");

export const pushSupported = () => Platform.OS === "web" && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const isIOS = () => Platform.OS === "web" && typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
export const isStandalone = () => Platform.OS === "web" && typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true);
export const pushPermission = (): "granted" | "denied" | "default" | "unsupported" => (pushSupported() ? Notification.permission : "unsupported");

function toKey(b64url: string) {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const raw = atob((b64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  const reg = await navigator.serviceWorker.register(base() + "sw.js", { scope: base() });
  await navigator.serviceWorker.ready;
  return reg;
}

/** 알림 켜기: 사용자가 버튼을 누른 직후에만 호출해야 한다(브라우저 규칙). */
export async function enableWebPush(roomId: string, uid: string): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "이 브라우저는 알림을 지원하지 않아요" };
  if (isIOS() && !isStandalone()) return { ok: false, reason: "아이폰은 먼저 홈 화면에 추가한 뒤, 그 아이콘으로 열어야 알림을 켤 수 있어요" };
  if (!VAPID) return { ok: false, reason: "알림 키가 빌드에 없어요" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "알림 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요" };
  const reg = await registration();
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID) }));
  return saveSub(roomId, uid, sub);
}

async function saveSub(roomId: string, uid: string, sub: PushSubscription) {
  const c = sb(); if (!c) return { ok: false, reason: "서버 연결이 없어요" };
  const { error } = await c.from("push_subs").upsert({ endpoint: sub.endpoint, room_id: roomId, uid, sub: sub.toJSON(), updated_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) return { ok: false, reason: error.code === "PGRST205" ? "서버에 push_subs 표가 아직 없어요 (schema.sql 실행)" : error.message };
  return { ok: true };
}

/** 이미 허용된 상태면 방이 바뀔 때 조용히 다시 등록 */
export async function refreshWebPush(roomId: string, uid: string) {
  try {
    if (!pushSupported() || Notification.permission !== "granted") return;
    const reg = await registration();
    const sub = await reg.pushManager.getSubscription(); if (!sub) return;
    await saveSub(roomId, uid, sub);
  } catch {}
}

/** 앱을 보고 있으면 쌓인 알림을 지운다 */
export async function clearShownNotifications() {
  try { if (!pushSupported()) return; const reg = await navigator.serviceWorker.getRegistration(base()); (await reg?.getNotifications({ tag: "amho-signal" }))?.forEach((n) => n.close()); } catch {}
}
