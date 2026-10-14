import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 서버 주소와 공개 키. 우선순위: 앱 설정 화면에서 입력한 값 > .env
// (publishable/anon 키는 클라이언트에 심도록 설계된 공개 키예요. secret/service_role은 절대 넣지 않기)
const K = "amho.server";
let client: SupabaseClient | null = null;
let cfg: { url: string; key: string } | null = null;

function build(url: string, key: string) {
  cfg = { url, key };
  client = createClient(url, key, { auth: { persistSession: false } });
}

export async function loadServerConfig() {
  try {
    const raw = await AsyncStorage.getItem(K);
    if (raw) { const v = JSON.parse(raw); if (v.url && v.key) { build(v.url, v.key); return; } }
  } catch {}
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL, key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) build(url, key);
}

export async function saveServerConfig(url: string, key: string) {
  // Connect 창의 .env.local 두 줄을 통째로 붙여넣어도 알아서 골라낸다
  const blob = url + "\n" + key;
  const u = blob.match(/https:\/\/[a-z0-9-]+\.supabase\.co/); if (u) url = u[0];
  const k = blob.match(/sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]{40,}/); if (k) key = k[0];
  url = url.trim().replace(/\/+$/, ""); key = key.trim();
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) throw new Error("주소는 https://xxxx.supabase.co 모양이어야 해요");
  if (key.length < 20) throw new Error("키가 너무 짧아요. publishable 또는 anon 키를 붙여넣어요");
  if (/^sb_secret|service_role/.test(key)) throw new Error("secret 키는 앱에 넣으면 안 돼요. publishable 키를 쓰세요");
  await AsyncStorage.setItem(K, JSON.stringify({ url, key }));
  build(url, key);
}

export async function clearServerConfig() { await AsyncStorage.removeItem(K); client = null; cfg = null; }
export const getServerConfig = () => cfg;
export const supabase = () => client;
export const serverReady = () => client !== null;
