-- 암호쳇 서버 스키마 (Supabase SQL Editor에 그대로 붙여넣기)
-- 원칙: 서버는 "누가 누구에게 어떤 숫자를 언제"만 안다. 뜻(meaning)은 절대 저장하지 않는다.
--       귓속말 본문은 기기에서 암호화된 상태로만 지나간다.

create table if not exists rooms (
  id text primary key,                 -- 12자 비밀 방 ID (초대 QR/링크에만 존재)
  created_at timestamptz default now()
);

create table if not exists room_members (
  room_id text references rooms(id) on delete cascade,
  uid text not null,
  name text not null,
  push_token text,                     -- Expo push token (숫자만 알림)
  seen_at timestamptz default now(),
  primary key (room_id, uid)
);

create table if not exists signals (
  id text primary key,
  room_id text references rooms(id) on delete cascade,
  from_uid text not null,
  kind text not null check (kind in ('code','whisper')),
  payload text not null,               -- code: "4" / whisper: nacl secretbox 암호문(base64)
  created_at timestamptz default now()
);
create index if not exists signals_room_time on signals (room_id, created_at);

-- 6자리 초대 코드 (10분 유효). 방 ID와 암호화 키를 잠깐 맡긴다.
-- QR·링크 초대는 이 테이블을 거치지 않으므로 서버가 키를 전혀 보지 않는다.
create table if not exists invites (
  code text primary key,
  room_id text references rooms(id) on delete cascade,
  key_b64 text not null,
  expires_at timestamptz not null
);

-- 10분 지난 신호와 만료 초대 정리 (pg_cron 확장 사용, 대시보드 > Database > Extensions에서 켜기)
-- select cron.schedule('amho-burn', '* * * * *', $$
--   delete from signals where created_at < now() - interval '10 minutes';
--   delete from invites where expires_at < now();
-- $$);

-- RLS: 1차 버전은 익명 키 + "방 ID를 아는 사람만" 모델.
-- 방 ID가 12자 난수라 URL 비밀값 역할을 한다. 2차에서 Supabase 익명 Auth로 강화할 것.
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table signals enable row level security;
alter table invites enable row level security;

create policy "anon rw rooms" on rooms for all to anon using (true) with check (true);
create policy "anon rw members" on room_members for all to anon using (true) with check (true);
create policy "anon rw signals" on signals for all to anon using (true) with check (true);
create policy "anon rw invites" on invites for all to anon using (true) with check (true);

-- Realtime: signals 테이블 변경을 구독할 수 있게
alter publication supabase_realtime add table signals;
