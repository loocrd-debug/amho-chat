// 귓속말 암호화: 두 기기가 초대 때 나눈 32바이트 키로 nacl secretbox.
// 서버는 암호문만 본다. 코드(숫자)는 암호화하지 않는다 — 푸시 알림에 그대로 띄우기 위해.
import "react-native-get-random-values";
import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from "tweetnacl-util";

export const newKey = () => encodeBase64(nacl.randomBytes(32));

export function seal(text: string, keyB64: string): string {
  const nonce = nacl.randomBytes(24);
  const box = nacl.secretbox(decodeUTF8(text), nonce, decodeBase64(keyB64));
  const out = new Uint8Array(24 + box.length); out.set(nonce); out.set(box, 24);
  return encodeBase64(out);
}

export function open(payloadB64: string, keyB64: string): string | null {
  try {
    const buf = decodeBase64(payloadB64);
    const plain = nacl.secretbox.open(buf.slice(24), buf.slice(0, 24), decodeBase64(keyB64));
    return plain ? encodeUTF8(plain) : null;
  } catch { return null; }
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 0/O, 1/I 제외
export const randomId = (n: number) => Array.from(nacl.randomBytes(n)).map((b) => ALPHA[b % ALPHA.length]).join("");
