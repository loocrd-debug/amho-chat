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

/** 붙여넣은 글자 뭉치에서 주소와 키만 골라낸다. 앞에 "sb_publishable_" 같은 글자가 잘못 붙어도 걸러낸다 */
export function normalizeServer(url: string, key: string): { url: string; key: string } | null {
  const blob = (url || "") + "\n" + (key || "");
  const u = blob.match(/https:\/\/[a-z0-9-]+\.supabase\.co/);
  const k = blob.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/) || blob.match(/sb_publishable_[A-Za-z0-9_-]+/);
  if (!u || !k) return null;
  return { url: u[0], key: k[0] };
}

export async function loadServerConfig() {
  const env = normalizeServer(process.env.EXPO_PUBLIC_SUPABASE_URL || "", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "");
  try {
    const raw = await AsyncStorage.getItem(K);
    if (raw) {
      const v = JSON.parse(raw);
      const n = normalizeServer(v.url, v.key);
      // 예전에 잘못 저장된 키(접두어가 붙은 것 등)는 여기서 자동으로 고쳐 다시 저장한다
      if (n) { if (n.key !== v.key || n.url !== v.url) await AsyncStorage.setItem(K, JSON.stringify(n)); build(n.url, n.key); return; }
      await AsyncStorage.removeItem(K); // 못 쓰는 값이면 버리고 .env로
    }
  } catch {}
  if (env) build(env.url, env.key);
}

export async function saveServerConfig(url: string, key: string) {
  if (/sb_secret|service_role/.test(url + key)) throw new Error("secret 키는 앱에 넣으면 안 돼요. publishable 키를 쓰세요");
  const n = normalizeServer(url, key);
  if (!n) throw new Error("주소(https://xxxx.supabase.co)와 키(eyJ… 또는 sb_publishable_…)를 찾지 못했어요");
  await AsyncStorage.setItem(K, JSON.stringify(n));
  build(n.url, n.key);
}

/** 서버가 이 키를 받아주는지 확인. 설정 화면의 "서버 상태"에 쓴다 */
export async function checkServer(): Promise<{ ok: boolean; detail: string }> {
  if (!cfg) return { ok: false, detail: "서버 설정 없음" };
  try {
    const r = await fetch(`${cfg.url}/auth/v1/settings`, { headers: { apikey: cfg.key } });
    if (r.status === 401) return { ok: false, detail: "키 거부됨 (401) · 설정에서 키를 다시 붙여넣어요" };
    if (r.ok) return { ok: true, detail: "서버 응답 OK" };
    return { ok: false, detail: `서버 응답 ${r.status}` };
  } catch (e: any) { return { ok: false, detail: `연결 실패 · ${e?.message || "네트워크"}` }; }
}

export async function clearServerConfig() { await AsyncStorage.removeItem(K); client = null; cfg = null; }
export const getServerConfig = () => cfg;
export const supabase = () => client;
export const serverReady = () => client !== null;
