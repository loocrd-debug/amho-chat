export type CodeStatus = "confirmed" | "mine" | "theirs"; // confirmed=둘 다 확인, mine=내가 제안(상대 확인 대기), theirs=상대 제안(내 확인 대기)
export type Code = { key: string; meaning: string; used: number; createdAt: number; confirmedBy: string[]; status?: CodeStatus; by?: string; byName?: string };
export type BookEvent =
  | { type: "propose"; key: string; meaning: string; from: string; name: string }
  | { type: "confirm"; key: string; from: string }
  | { type: "delete"; key: string; from: string }
  | { type: "sync"; from: string; name: string; codes: { key: string; meaning: string; status: CodeStatus }[] };
export type Message =
  | { id: string; type: "code"; key: string; from: string; at: number }
  | { id: string; type: "whisper"; text: string; from: string; at: number; burned?: boolean };
export type Member = { id: string; name: string; seenAt: number };
export type Settings = { name: string; uid: string; lockReveal: boolean; catAgent: boolean; slots: number; room: { id: string; key: string } | null };
