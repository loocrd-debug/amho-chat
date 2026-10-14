import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Linking from "expo-linking";
import { storage, uid as mkId } from "./storage";
import { LocalTransport, SupabaseTransport, type Transport } from "../sync/transport";
import { serverReady, loadServerConfig, saveServerConfig, clearServerConfig, getServerConfig } from "../sync/supabase";
import { createRoom, joinRoom, leaveRoom, parseInvite, redeemCode, type Room } from "../sync/invite";
import { registerPush } from "../sync/push";
import { TTL_MS, FREE_SLOTS } from "../theme";
import type { Code, Message, Settings, BookEvent } from "./types";

type Store = {
  ready: boolean;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
  codes: Record<string, Code>;
  codeList: Code[];
  addCode: (key: string, meaning: string) => void;
  confirmCode: (key: string) => void;
  removeCode: (key: string) => void;
  msgs: Message[];
  sendCode: (key: string) => void;
  sendWhisper: (text: string) => void;
  burn: (id: string) => void;
  burnAll: () => void;
  // 파트너
  serverOn: boolean;
  serverCfg: { url: string; key: string } | null;
  setServer: (url: string, key: string) => Promise<void>;
  clearServer: () => Promise<void>;
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
  const [serverTick, setServerTick] = useState(0);
  const codesRef = useRef(codes); codesRef.current = codes;
  const tRef = useRef<Transport | null>(null);
  const catRef = useRef<LocalTransport | null>(null); // 고양이 요원은 항상 대기

  // 불러오기
  useEffect(() => {
    (async () => {
      await loadServerConfig();
      const [c, m, s] = await Promise.all([storage.loadCodes(), storage.loadMsgs(), storage.loadSettings()]);
      setCodes(c); setMsgs(m.filter((x) => Date.now() - x.at < TTL_MS)); if (s) setS((d) => ({ ...d, ...s, room: s.room ?? null })); setReady(true);
    })();
  }, []);
  useEffect(() => { if (ready) storage.saveCodes(codes); }, [codes, ready]);
  useEffect(() => { if (ready) storage.saveMsgs(msgs); }, [msgs, ready]);
  useEffect(() => { if (ready) storage.saveSettings(settings); }, [settings, ready]);

  // 고양이 요원(연습 상대): 파트너가 없을 때 답장
  useEffect(() => {
    const cat = new LocalTransport(() => Object.keys(codesRef.current)); catRef.current = cat;
    const u = cat.onMessage((m) => setMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m])));
    const ub = cat.onBook(applyBook);
    return () => { u(); ub(); cat.close(); };
  }, []);

  // 전송 계층: 방이 있으면 서버로 중계
  useEffect(() => {
    if (!ready) return;
    tRef.current?.close(); tRef.current = null; setPartner(null);
    if (!(settings.room && serverReady())) return;
    let t: Transport;
    try { t = new SupabaseTransport(settings.room.id, settings.room.key, settings.uid, settings.name || "요원"); registerPush(settings.room.id, settings.uid); }
    catch (e: any) { setError(e.message); return; }
    tRef.current = t;
    const u1 = t.onMessage((m) => setMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m])));
    const u2 = t.onPresence((o) => {
      const next = o[0] ?? null;
      setPartner((prev) => {
        // 파트너가 새로 들어오면 내 설정집을 통째로 보내 맞춘다
        if (next && (!prev || prev.uid !== next.uid)) t.sendBook({ type: "sync", from: settings.uid, name: settings.name || "요원", codes: Object.values(codesRef.current).map((c) => ({ key: c.key, meaning: c.meaning, status: c.status ?? "confirmed" })) }).catch(() => {});
        return next;
      });
    });
    const u3 = t.onBook(applyBook);
    return () => { u1(); u2(); u3(); t.close(); };
  }, [ready, settings.room?.id, settings.uid, serverTick]);

  // 설정집 동기화 규칙
  function applyBook(ev: BookEvent) {
    setCodes((c) => {
      const n = { ...c };
      const mergeIn = (key: string, meaning: string, from: string, name: string) => {
        const cur = n[key];
        if (!cur) n[key] = { key, meaning, used: 0, createdAt: Date.now(), confirmedBy: [from], status: "theirs", by: from, byName: name };
        else if (cur.meaning === meaning) n[key] = { ...cur, status: "confirmed", confirmedBy: Array.from(new Set([...cur.confirmedBy, from])) };
        else if (cur.status !== "confirmed") n[key] = { ...cur, meaning, status: "theirs", by: from, byName: name }; // 아직 확정 전이면 상대 뜻을 보여준다
      };
      if (ev.type === "propose") mergeIn(ev.key, ev.meaning, ev.from, ev.name);
      else if (ev.type === "confirm") { if (n[ev.key]) n[ev.key] = { ...n[ev.key], status: "confirmed", confirmedBy: Array.from(new Set([...n[ev.key].confirmedBy, ev.from])) }; }
      else if (ev.type === "delete") { delete n[ev.key]; }
      else if (ev.type === "sync") ev.codes.forEach((x) => mergeIn(x.key, x.meaning, ev.from, ev.name));
      return n;
    });
  }

  // 초대 링크로 열렸을 때
  useEffect(() => {
    const handle = async (url: string | null) => { if (url) await joinByLink(url); };
    Linking.getInitialURL().then(handle);
    if (typeof window !== "undefined" && window.location?.hash?.startsWith("#j-")) { const h = window.location.hash.slice(1); handle(h); try { window.history.replaceState(null, "", window.location.pathname); } catch {} }
    const sub = Linking.addEventListener("url", (e) => handle(e.url));
    return () => sub.remove();
  }, [settings.uid, settings.name]);

  // 서버가 켜져 있는데 방이 없으면 자동으로 내 방을 만든다 (초대 링크가 항상 준비되도록)
  useEffect(() => {
    if (!ready || !settings.name || settings.room || !serverReady()) return;
    createRoom(settings.uid, settings.name).then((room) => setS((s) => (s.room ? s : { ...s, room }))).catch(() => {});
  }, [ready, settings.name, settings.room?.id, serverTick]);

  // 10분 소멸
  useEffect(() => { const t = setInterval(() => setMsgs((p) => p.filter((x) => Date.now() - x.at < TTL_MS)), 15000); return () => clearInterval(t); }, []);

  const push = (m: Message) => setMsgs((p) => [...p, m]);
  const sendVia = (out: Parameters<Transport["send"]>[0]) => {
    tRef.current?.send(out).catch((e: any) => setError(e.message));
    if (settings.catAgent && !partner) catRef.current?.send(out).catch(() => {}); // 파트너가 없으면 고양이가 답한다
  };

  const joinByLink = async (url: string) => {
    const room = parseInvite(url); if (!room) return false;
    try { await joinRoom(room, settings.uid, settings.name || "요원"); setS((s) => ({ ...s, room })); setError(null); return true; } catch (e: any) { setError(e.message); return false; }
  };

  const store: Store = {
    ready, settings,
    setSettings: (p) => setS((s) => ({ ...s, ...p })),
    codes,
    codeList: Object.values(codes).sort((a, b) => b.used - a.used || a.key.localeCompare(b.key)),
    addCode: (key, meaning) => {
      const pending = !!tRef.current && !!partner; // 상대가 있으면 상대 확인을 기다린다
      setCodes((c) => ({ ...c, [key]: { key, meaning, used: 0, createdAt: Date.now(), confirmedBy: [settings.uid], status: pending ? "mine" : "confirmed", by: settings.uid } }));
      const ev: BookEvent = { type: "propose", key, meaning, from: settings.uid, name: settings.name || "요원" };
      tRef.current?.sendBook(ev).catch(() => {});
      if (!partner && settings.catAgent) catRef.current?.sendBook(ev).catch(() => {});
    },
    confirmCode: (key) => {
      setCodes((c) => (c[key] ? { ...c, [key]: { ...c[key], status: "confirmed", confirmedBy: Array.from(new Set([...c[key].confirmedBy, settings.uid])) } } : c));
      tRef.current?.sendBook({ type: "confirm", key, from: settings.uid }).catch(() => {});
    },
    removeCode: (key) => { setCodes((c) => { const n = { ...c }; delete n[key]; return n; }); tRef.current?.sendBook({ type: "delete", key, from: settings.uid }).catch(() => {}); },
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
    serverCfg: getServerConfig(),
    setServer: async (url, key) => { await saveServerConfig(url, key); setError(null); setServerTick((t) => t + 1); },
    clearServer: async () => { await clearServerConfig(); setS((s) => ({ ...s, room: null })); setServerTick((t) => t + 1); },
    partner,
    startRoom: async () => { const room = await createRoom(settings.uid, settings.name || "요원"); setS((s) => ({ ...s, room })); return room; },
    joinByLink,
    joinByCode: async (code) => { try { const room = await redeemCode(code.trim()); if (!room) return false; await joinRoom(room, settings.uid, settings.name || "요원"); setS((s) => ({ ...s, room })); return true; } catch (e: any) { setError(e.message); return false; } },
    leave: async () => { if (settings.room) await leaveRoom(settings.room, settings.uid); setS((s) => ({ ...s, room: null })); setPartner(null); },
    error,
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
