// 설정집과 뜻은 폰에만 저장한다. 서버로 나가는 건 코드(숫자)뿐이다.
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Code, Message, Settings } from "./types";

const K = { codes: "amho.codes", msgs: "amho.msgs", settings: "amho.settings" };

async function read<T>(key: string, fallback: T): Promise<T> {
  try { const v = await AsyncStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
async function write(key: string, v: unknown) {
  try { await AsyncStorage.setItem(key, JSON.stringify(v)); } catch {}
}

export const storage = {
  loadCodes: () => read<Record<string, Code>>(K.codes, {}),
  saveCodes: (c: Record<string, Code>) => write(K.codes, c),
  loadMsgs: () => read<Message[]>(K.msgs, []),
  saveMsgs: (m: Message[]) => write(K.msgs, m),
  loadSettings: () => read<Settings | null>(K.settings, null),
  saveSettings: (s: Settings) => write(K.settings, s),
  wipeMsgs: () => write(K.msgs, []),
};

export const uid = () => Math.random().toString(36).slice(2, 10);
