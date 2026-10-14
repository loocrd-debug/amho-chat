# 푸시 알림(홈 화면 앱) 켜는 순서

앱(0.5.0)은 이미 알림을 받을 준비가 되어 있어요. 서버 쪽에 세 가지만 해 주면 됩니다.

## 1. 서버에 표 하나 만들기 (1분)
Supabase 대시보드 → 왼쪽 **SQL Editor** → 아래를 붙여넣고 **Run**.
(`supabase/schema.sql` 맨 아래 "0.5.0 추가" 부분과 같은 내용)

```sql
create table if not exists push_subs (
  endpoint text primary key, room_id text not null, uid text not null,
  sub jsonb not null, updated_at timestamptz default now());
create index if not exists push_subs_room on push_subs (room_id);
alter table push_subs enable row level security;
drop policy if exists "anon rw push_subs" on push_subs;
create policy "anon rw push_subs" on push_subs for all to anon using (true) with check (true);
```

## 2. GitHub에 비밀값 두 개 넣기 (3분)
GitHub 저장소(amho-chat) → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| 이름 | 값 | 어디서 |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | `sbp_…` | https://supabase.com/dashboard/account/tokens → Generate new token (이름 아무거나) |
| `VAPID_PRIVATE_KEY` | 전달받은 개인키 | 클로드가 만들어 준 vapid-private.txt |

## 3. 배포 파일을 제자리에 두기
`supabase/github-workflow-supabase.yml` 을 `.github/workflows/supabase.yml` 로 옮기고 올리면,
GitHub Actions가 알아서 `notify` 함수를 Supabase에 배포해요 (Actions 탭에서 초록 체크 확인).

## 4. 폰에서 켜기
- 아이폰: 사파리로 https://loocrd-debug.github.io/amho-chat/ 열기 → 공유 버튼 → **홈 화면에 추가** → 홈 화면 아이콘으로 열기 → 이름 입력 → 설정 → **초대 받기**에 카톡으로 받은 링크 붙여넣기 → 설정의 **알림 → 켜기**
  (홈 화면 앱은 사파리와 저장공간이 달라서 방에 한 번 더 들어가야 해요)
- 안드로이드(크롬): 주소 열기 → 설정 → **알림 → 켜기** (홈 화면 추가는 선택)

이후 상대가 "4"를 보내면 앱이 닫혀 있어도 "암호쳇 · 4" 알림이 와요. 뜻은 알림에 없어요.
