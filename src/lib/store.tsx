import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Linking from "expo-linking";
import { storage, uid as mkId } from "./storage";
import { LocalTransport, SupabaseTransport, type Transport } from "../sync/transport";
import { serverReady } from "../sync/supabase";
import { createRoom, joinRoom, leaveRoom, parseInvite, redeemCode, type Room } from "../sync/invite";
import { registerPush } from "../sync/push";
import { TTL_MS, FREE_SLOTS } from "../theme";
import type { Code, Message, Settings } from "./types";

type Store = {
  ready: boolean;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
  codes: Record<string, Code>;
  codeList: Code[];
  addCode: (key: string, meaning: string) => void;
  removeCode: (key: string) => void;
  msgs: Message[];
  sendCode: (key: string) => void;
  sendWhisper: (text: string) => void;
  burn: (id: string) => void;
  burnAll: () => void;
  // 파트너
  serverOn: boolean;
  partner: { uid: string; name: string } | null;
  startRoom: () => Promise<Room>;
  joinByLink: (url: string) => Promise<boolean>;
  joinByCode: (code: string) => Promise<boolean>;
  leave: () => Promise<void>;
  error: string | null;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error("StoreProvider 바깥"); return s; };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setS] = useState<Settings>({ name: "", uid: mkId(), lockReveal: false, catAgent: true, slots: FREE_SLOTS, room: null });
  const [codes, setCodes] = useState<Record<string, Code>>({});
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [partner, setPartner] = useState<{ uid: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const codesRef = useRef(codes); codesRef.current = codes;
  const tRef = useRef<Transport | null>(null);

  // 불러오기
  useEffect(() => {
    (async () => {
      const [c, m, s] = await Promise.all([storage.loadCodes(), storage.loadMsgs(), storage.loadSettings()]);
      setCodes(c); setMsgs(m.filter((x) => Date.now() - x.at < TTL_MS)); if (s) setS((d) => ({ ...d, ...s, room: s.room ?? null })); setReady(true);
    })();
  }, []);
  useEffect(() => { if (ready) storage.saveCodes(codes); }, [codes, ready]);
  useEffect(() => { if (ready) storage.saveMsgs(msgs); }, [msgs, ready]);
  useEffect(() => { if (ready) storage.saveSettings(settings); }, [settings, ready]);

  // 전송 계층: 방이 있으면 서버, 없으면 고양이 요원
  useEffect(() => {
    if (!ready) return;
    tRef.current?.close();
    let t: Transport;
    if (settings.room && serverReady()) {
      try { t = new SupabaseTransport(settings.room.id, settings.room.key, settings.uid, settings.name || "요원"); registerPush(settings.room.id, settings.uid); }
      catch (e: any) { setError(e.message); t = new LocalTransport(() => Object.keys(codesRef.current)); }
    } else { t = new LocalTransport(() => Object.keys(codesRef.current)); setPartner(null); }
    tRef.current = t;
    const u1 = t.onMessage((m) => setMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m])));
    const u2 = t.onPresence((o) => setPartner(o[0] ?? null));
    return () => { u1(); u2(); t.close(); };
  }, [ready, settings.room?.id, settings.uid]);

  // 초대 링크로 열렸을 때
  useEffect(() => {
    const handle = async (url: string | null) => { if (url) await joinByLink(url); };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener("url", (e) => handle(e.url));
    return () => sub.remove();
  }, [settings.uid, settings.name]);

  // 10분 소멸
  useEffect(() => { const t = setInterval(() => setMsgs((p) => p.filter((x) => Date.now() - x.at < TTL_MS)), 15000); return () => clearInterval(t); }, []);

  const push = (m: Message) => setMsgs((p) => [...p, m]);
  const practice = !settings.room && settings.catAgent;
  const sendVia = (out: Parameters<Transport["send"]>[0]) => { if (settings.room || practice) tRef.current?.send(out).catch((e: any) => setError(e.message)); };

  const joinByLink = async (url: string) => {
    const room = parseInvite(url); if (!room) return false;
    try { await joinRoom(room, settings.uid, settings.name || "요원"); setS((s) => ({ ...s, room })); setError(null); return true; } catch (e: any) { setError(e.message); return false; }
  };

  const store: Store = {
    ready, settings,
    setSettings: (p) => setS((s) => ({ ...s, ...p })),
    codes,
    codeList: Object.values(codes).sort((a, b) => b.used - a.used || a.key.localeCompare(b.key)),
    addCode: (key, meaning) => setCodes((c) => ({ ...c, [key]: { key, meaning, used: 0, createdAt: Date.now(), confirmedBy: [settings.uid] } })),
    removeCode: (key) => setCodes((c) => { const n = { ...c }; delete n[key]; return n; }),
    msgs,
    sendCode: (key) => {
      push({ id: mkId(), type: "code", key, from: settings.uid, at: Date.now() });
      setCodes((c) => (c[key] ? { ...c, [key]: { ...c[key], used: c[key].used + 1 } } : c));
      sendVia({ type: "code", key, from: settings.uid });
    },
    sendWhisper: (text) => { push({ id: mkId(), type: "whisper", text, from: settings.uid, at: Date.now() }); sendVia({ type: "whisper", text, from: settings.uid }); },
    burn: (id) => setMsgs((p) => p.filter((x) => x.id !== id)),
    burnAll: () => { setMsgs([]); storage.wipeMsgs(); },
    serverOn: serverReady(),
    partner,
    startRoom: async () => { const room = await createRoom(settings.uid, settings.name || "요원"); setS((s) => ({ ...s, room })); return room; },
    joinByLink,
    joinByCode: async (code) => { try { const room = await redeemCode(code.trim()); if (!room) return false; await joinRoom(room, settings.uid, settings.name || "요원"); setS((s) => ({ ...s, room })); return true; } catch (e: any) { setError(e.message); return false; } },
    leave: async () => { if (settings.room) await leaveRoom(settings.room, settings.uid); setS((s) => ({ ...s, room: null })); setPartner(null); },
    error,
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
