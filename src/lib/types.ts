export type Code = { key: string; meaning: string; used: number; createdAt: number; confirmedBy: string[] };
export type Message =
  | { id: string; type: "code"; key: string; from: string; at: number }
  | { id: string; type: "whisper"; text: string; from: string; at: number; burned?: boolean };
export type Member = { id: string; name: string; seenAt: number };
export type Settings = { name: string; uid: string; lockReveal: boolean; catAgent: boolean; slots: number; room: { id: string; key: string } | null };
