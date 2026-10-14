// Supabase Edge Function: signals 테이블에 행이 들어오면 상대에게 Expo 푸시를 보낸다.
// 알림 본문은 코드면 숫자 그대로("4"), 귓속말이면 "귓속말"만. 뜻은 어디에도 없다.
//
// 배포: supabase functions deploy notify --no-verify-jwt
// 연결: Database > Webhooks > signals INSERT → 이 함수 URL (POST)

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { record } = await req.json();
  if (!record?.room_id) return new Response("skip", { status: 200 });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: members } = await sb.from("room_members").select("uid, push_token").eq("room_id", record.room_id).neq("uid", record.from_uid);
  const tokens = (members ?? []).map((m) => m.push_token).filter((t): t is string => !!t && t.startsWith("ExponentPushToken"));
  if (!tokens.length) return new Response("no tokens", { status: 200 });

  const body = record.kind === "code" ? String(record.payload) : "귓속말";
  const messages = tokens.map((to) => ({ to, title: "암호쳇", body, sound: "default", data: { room: record.room_id }, priority: "high" }));
  const r = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(messages),
  });
  return new Response(await r.text(), { status: 200 });
});
