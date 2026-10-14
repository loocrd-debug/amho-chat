// 암호쳇 디자인 시스템 토큰 (tokens.json과 1:1)
export const color = {
  bg000: "#0E0E10", bg100: "#161619", bg200: "#26262A",
  line100: "#1F1F23", line200: "#2C2C30", line300: "#3A3A3F",
  ink: "#F4F4F2", inkOnInk: "#0E0E10", inkMuted: "#9A9A9E", inkFaint: "#808086",
  accent: "#FF6A3D", accentInk: "#FF6A3D", inkOnAccent: "#0E0E10",
  danger: "#F0544F", overlay: "rgba(14,14,16,0.7)",
};
export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s8: 32 };
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };
export const font = { regular: "IBMPlexSansKR_400Regular", medium: "IBMPlexSansKR_500Medium", bold: "IBMPlexSansKR_700Bold" };
export const type = {
  codeXl: { fontFamily: font.medium, fontSize: 32, lineHeight: 34 },
  codeLg: { fontFamily: font.bold, fontSize: 22, lineHeight: 24 },
  codeMd: { fontFamily: font.bold, fontSize: 16, lineHeight: 18 },
  title: { fontFamily: font.bold, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
  bodyStrong: { fontFamily: font.bold, fontSize: 15, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  meaning: { fontFamily: font.medium, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: font.regular, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 1 },
  micro: { fontFamily: font.regular, fontSize: 11, lineHeight: 14 },
} as const;
export const TTL_MS = 10 * 60 * 1000;   // 메시지 소멸
export const REVEAL_MS = 2000;          // 해독·귓속말 노출 시간
export const FREE_SLOTS = 12;           // 무료 코드 칸
