// 전송 계층. 서버는 "누가 누구에게 어떤 숫자를 언제"만 중계한다.
//  - LocalTransport   : 파트너가 없을 때 고양이 요원이 답장하는 연습 모드
//  - SupabaseTransport: 실제 파트너. 코드는 그대로, 귓속말은 암호화해서 보낸다.
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Message, BookEvent } from "../lib/types";
import { supabase as sb } from "./supabase";
import { seal, open, randomId } from "./crypto";
import { TTL_MS } from "../theme";

type DistOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type Outgoing = DistOmit<Message, "id" | "at">;

export interface Transport {
  send(msg: Outgoing): Promise<void>;
  onMessage(cb: (msg: Message) => void): () => void;
  onPresence(cb: (others: { uid: string; name: string }[]) => void): () => void;
  sendBook(ev: BookEvent): Promise<void>;
  onBook(cb: (ev: BookEvent) => void): () => void;
  close(): void;
}

/** 연습 모드: 파트너 대신 고양이 요원이 답장한다. */
export class LocalTransport implements Transport {
  private listeners = new Set<(m: Message) => void>();
  constructor(private codeKeys: () => string[]) {}
  onMessage(cb: (m: Message) => void) { this.listeners.add(cb); return () => { this.listeners.delete(cb); }; }
  onPresence(cb: (o: { uid: string; name: string }[]) => void) { cb([]); return () => {}; }
  private bookL = new Set<(e: BookEvent) => void>();
  onBook(cb: (e: BookEvent) => void) { this.bookL.add(cb); return () => { this.bookL.delete(cb); }; }
  async sendBook(ev: BookEvent) {
    if (ev.type === "propose") setTimeout(() => this.bookL.forEach((l) => l({ type: "confirm", key: ev.key, from: "cat" })), 800); // 고양이는 뭐든 확인해 준다
  }
  close() {}
  async send(msg: Outgoing) {
    const keys = this.codeKeys();
    if (!keys.length) return;
    const lines = ["옆에 부장님 있음. 나중에", "지금 회의실. 끝나면 4", "봤어. 아무도 모름", "창밖 봐봐"];
    setTimeout(() => {
      const reply: Message = Math.random() < 0.25
        ? { id: randomId(10), type: "whisper", text: lines[Math.floor(Math.random() * lines.length)], from: "cat", at: Date.now() }
        : { id: randomId(10), type: "code", key: msg.type === "code" && Math.random() < 0.6 ? msg.key : keys[Math.floor(Math.random() * keys.length)], from: "cat", at: Date.now() };
      this.listeners.forEach((l) => l(reply));
    }, 900 + Math.random() * 1200);
  }
}

/**
 * 실제 파트너 연결.
 *  - Realtime Broadcast로 즉시 전달, signals 테이블에도 기록(오프라인 상대 + 푸시 트리거)
 *  - 접속 시 최근 10분 신호를 가져오고, 받은 신호는 지운다
 *  - Presence로 "접선 중" 표시
 */
export class SupabaseTransport implements Transport {
  private ch: RealtimeChannel;
  private msgL = new Set<(m: Message) => void>();
  private preL = new Set<(o: { uid: string; name: string }[]) => void>();
  private bookL = new Set<(e: BookEvent) => void>();
  private seen = new Set<string>();

  constructor(private roomId: string, private key: string, private uid: string, name: string) {
    if (!sb()) throw new Error("서버 설정이 없어요 (설정 탭에서 서버 주소와 키 입력)");
    this.ch = sb()!.channel("room:" + roomId, { config: { presence: { key: uid }, broadcast: { self: false } } });
    this.ch
      .on("broadcast", { event: "signal" }, ({ payload }) => this.deliver(payload))
      .on("broadcast", { event: "book" }, ({ payload }) => this.deliverBook(payload))
      .on("presence", { event: "sync" }, () => {
        const state = this.ch.presenceState<{ name: string }>();
        const others = Object.entries(state).filter(([k]) => k !== uid).map(([k, v]) => ({ uid: k, name: v[0]?.name ?? "파트너" }));
        this.preL.forEach((l) => l(others));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") { await this.ch.track({ name }); this.backfill(); }
      });
  }

  private decode(row: { id: string; from_uid: string; kind: string; payload: string; created_at?: string; at?: number }): Message | null {
    const at = row.at ?? (row.created_at ? Date.parse(row.created_at) : Date.now());
    if (row.kind === "code") return { id: row.id, type: "code", key: row.payload, from: row.from_uid, at };
    const text = open(row.payload, this.key);
    return text === null ? null : { id: row.id, type: "whisper", text, from: row.from_uid, at };
  }
  private deliver(row: any) {
    if (!row || row.from_uid === this.uid || this.seen.has(row.id)) return;
    this.seen.add(row.id);
    const m = this.decode(row); if (m) this.msgL.forEach((l) => l(m));
  }
  private async backfill() {
    const since = new Date(Date.now() - TTL_MS).toISOString();
    const { data, error } = await sb()!.from("signals").select("*").eq("room_id", this.roomId).neq("from_uid", this.uid).gt("created_at", since).order("created_at");
    if (error) return; // 테이블이 없으면(SQL 전) 실시간 중계만 쓴다
    (data ?? []).forEach((r) => this.deliver(r));
    if (data?.length) await sb()!.from("signals").delete().in("id", data.map((r) => r.id)); // 받았으니 서버에서 소멸
  }

  private deliverBook(p: any) {
    if (!p || p.from === this.uid) return;
    const dec = (t: string) => open(t, this.key) ?? "";
    let ev: BookEvent | null = null;
    if (p.type === "propose") ev = { type: "propose", key: p.key, meaning: dec(p.meaning), from: p.from, name: p.name };
    else if (p.type === "confirm" || p.type === "delete") ev = { type: p.type, key: p.key, from: p.from };
    else if (p.type === "sync") ev = { type: "sync", from: p.from, name: p.name, codes: (p.codes ?? []).map((c: any) => ({ key: c.key, meaning: dec(c.meaning), status: c.status })) };
    if (ev) this.bookL.forEach((l) => l(ev!));
  }
  onBook(cb: (e: BookEvent) => void) { this.bookL.add(cb); return () => { this.bookL.delete(cb); }; }
  async sendBook(ev: BookEvent) {
    const enc = (t: string) => seal(t, this.key);
    const payload: any = ev.type === "propose" ? { ...ev, meaning: enc(ev.meaning) }
      : ev.type === "sync" ? { ...ev, codes: ev.codes.map((c) => ({ ...c, meaning: enc(c.meaning) })) } : ev;
    await this.ch.send({ type: "broadcast", event: "book", payload });
  }

  async send(msg: Outgoing) {
    const id = randomId(12);
    const row = { id, room_id: this.roomId, from_uid: this.uid, kind: msg.type, payload: msg.type === "code" ? msg.key : seal(msg.text, this.key) };
    await this.ch.send({ type: "broadcast", event: "signal", payload: { ...row, at: Date.now() } });
    await sb()!.from("signals").insert(row).then(() => {}, () => {}); // 테이블이 없으면 실시간 중계만
  }
  onMessage(cb: (m: Message) => void) { this.msgL.add(cb); return () => { this.msgL.delete(cb); }; }
  onPresence(cb: (o: { uid: string; name: string }[]) => void) { this.preL.add(cb); return () => { this.preL.delete(cb); }; }
  close() { sb()?.removeChannel(this.ch); }
}
