# 암호쳇 서버 연결 안내 (Supabase, 약 20분)

서버가 하는 일은 딱 셋이에요. 숫자 중계, 암호화된 귓속말 중계(10분 보관), 푸시 알림. 뜻(설정집)은 서버에 없어요.

## 1. Supabase 프로젝트 만들기
1. https://supabase.com 가입 → New project (리전은 Northeast Asia(Seoul) 권장, 무료 플랜이면 충분)
2. 왼쪽 메뉴 **SQL Editor** → `supabase/schema.sql` 내용 전체 붙여넣고 Run
3. **Project Settings > API** 에서 `Project URL`과 `anon public` 키 복사
4. 프로젝트 폴더의 `.env.example`을 `.env`로 복사하고 두 값 채우기

여기까지 하면 앱에서 "초대 만들기 / 초대 받기"가 켜져요. 푸시 없이도 두 폰이 켜져 있으면 실시간으로 주고받아요.

## 2. 10분 자동 소멸 (선택, 권장)
Database > Extensions 에서 `pg_cron` 켜기 → SQL Editor에서 `schema.sql` 맨 아래 주석 처리된 `cron.schedule(...)` 블록의 주석을 풀고 Run.
(안 켜도 앱이 받은 신호는 스스로 지우지만, 상대가 영영 안 열면 남아요.)

## 3. 푸시 알림 (선택)
1. Supabase CLI 설치: `npm i -g supabase` → `supabase login` → `supabase link --project-ref <ref>`
2. `supabase functions deploy notify --no-verify-jwt`
3. Database > Webhooks > Create: 테이블 `signals`, 이벤트 `Insert`, 타입 HTTP Request, URL은 방금 배포된 함수 URL, 메서드 POST
4. 앱은 EAS 빌드(개발 빌드 이상)에서만 푸시 토큰을 받아요. Expo Go에서는 알림이 오지 않아요.
   `npx eas init` 후 app.json의 `YOUR-EAS-PROJECT-ID`가 자동으로 채워져요.

알림에는 "암호쳇 / 4" 처럼 숫자만 떠요. 귓속말은 "귓속말"이라고만.

## 4. 두 폰으로 테스트
- 폰 A: 설정 → 초대 만들기 → 카톡으로 링크 보내기 (또는 QR)
- 폰 B: 링크를 열면 앱이 켜지며 바로 같은 방. (Expo Go에서는 링크 대신 "초대 받기 → QR 찍기"가 확실해요)
- 둘 다 설정집에 같은 코드를 넣어야 해요. 1차 버전은 설정집 자동 동기화가 없어요 → 다음 단계

## 보안 메모 (솔직한 상태)
- 익명 키 + "방 ID(12자 난수)를 아는 사람만" 모델이에요. 방 ID가 비밀번호 역할이라 링크를 받은 사람은 누구나 들어올 수 있어요. 2차에서 Supabase 익명 Auth + RLS로 "멤버만" 제한 예정.
- 6자리 코드 초대는 10분 동안 서버가 귓속말 키를 맡아요. QR/링크 초대는 서버가 키를 전혀 못 봐요. 앱 안에도 이 차이를 적어뒀어요.
- 귓속말 암호화는 tweetnacl secretbox(XSalsa20-Poly1305), 키 32바이트. 코드(숫자)는 알림에 띄우기 위해 평문이에요. 이건 "서버는 숫자만 안다"는 설계 결정과 일치해요.
