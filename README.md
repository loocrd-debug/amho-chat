# 암호쳇 (amho-chat) — 1차 버전 앱 코드

둘만 아는 숫자 하나로 마음을 전하는 앱. React Native + Expo.

## 지금 들어 있는 것
- 설정집: 코드(숫자·알파벳 2자) + 뜻 등록, 탭하면 복사(카톡·문자에 붙여넣기), 길게 눌러 삭제, 12칸 제한과 칸 확장 시트(결제 자리)
- 비밀 채팅: 코드 칩 전송, 말풍선 길게 눌러 2초 해독, 귓속말(가려짐 → 길게 눌러 2초 → 소멸), 10분 자동 소멸
- 보안: 해독 시 지문·얼굴 확인 옵션(expo-local-authentication)
- 연습 모드: 파트너가 없으면 고양이 요원이 답장(LocalTransport)
- 저장: 설정집·뜻·대화는 폰에만(AsyncStorage). 서버로는 숫자만 나가도록 Transport 인터페이스 분리

- 파트너 연결(0.2): Supabase Realtime 중계, 초대 QR·링크·6자리 코드, 귓속말 암호화(tweetnacl), 숫자만 보이는 푸시 알림 → 설정 방법은 `SETUP-서버연결.md`

## 아직 없는 것 (다음)
- 설정집 동기화(둘 다 확인하면 저장), 홈 위젯, 인앱 결제(RevenueCat), 아이콘 위장, 스크린샷 방지, 익명 Auth 기반 RLS 강화

## 실행 (윈도우에서)
```bash
npm install
npx expo start          # 폰에 Expo Go 설치 후 QR 스캔
```
iOS 빌드는 맥 없이 EAS로: `npx eas build -p ios` (Apple 개발자 계정 필요).

## 구조
```
App.tsx                      진입, 탭 셸, 환영 화면
src/theme.ts                 디자인 시스템 토큰 (tokens.json과 동일)
src/lib/store.tsx            상태(설정집·메시지·설정) + 로컬 저장 + 소멸 타이머
src/lib/storage.ts           AsyncStorage 래퍼
src/lib/reveal.ts            해독 잠금(생체 인증)
src/sync/transport.ts        전송 계층 (Local = 고양이 연습, Supabase = 실제 파트너)
src/sync/invite.ts           방 만들기·초대 링크/QR/6자리·참여
src/sync/crypto.ts           귓속말 암호화(nacl secretbox)
src/sync/push.ts             Expo 푸시 토큰 등록
supabase/schema.sql          서버 테이블·RLS
supabase/functions/notify    푸시 Edge Function
src/components/              Button·CodeBubble·Whisper·CodeKey·CodeRow·TabBar
src/screens/                 Codebook·Chat·Settings·InviteSheet
assets/mascot/               마스코트 PNG (3D 7포즈 + 납작 1)
```
