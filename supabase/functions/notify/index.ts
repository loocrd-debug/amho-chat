// Supabase Edge Function "notify": 신호가 오가면 상대에게 알림을 보낸다.
//  - 웹 푸시(홈 화면 앱): push_subs 테이블의 구독으로 전송 (VAPID 키 필요)
//  - Expo 푸시(네이티브 앱, 나중): room_members.push_token
// 알림 본문은 코드면 숫자 그대로("4"), 귓속말이면 "귓속말"만. 뜻은 어디에도 없다.
//
// 호출: 앱이 신호를 보낸 직후 functions.invoke("notify", { body: { room_id, from_uid, kind, payload } })
//       (Database Webhook으로 signals INSERT → 이 함수에 연결해도 됨: { record } 모양도 받는다)
// 배포: supabase functions deploy notify --no-verify-jwt
// 비밀값: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let body: any = {};
  try { body = await req.json(); } catch {}
  const rec = body.record ?? body;
  if (!rec?.room_id || !rec?.from_uid) return new Response("skip", { status: 200, headers: cors });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const text = rec.kind === "code" ? String(rec.payload).slice(0, 2) : "귓속말";
  const out: string[] = [];

  // 1) 웹 푸시
  const pub = Deno.env.get("VAPID_PUBLIC_KEY"), priv = Deno.env.get("VAPID_PRIVATE_KEY");
  if (pub && priv) {
    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:amho@example.com", pub, priv);
    const { data: subs } = await sb.from("push_subs").select("endpoint, sub").eq("room_id", rec.room_id).neq("uid", rec.from_uid);
    const payload = JSON.stringify({ title: "암호쳇", body: text });
    for (const s of subs ?? []) {
      try { await webpush.sendNotification(s.sub, payload, { TTL: 600, urgency: "high" }); out.push("web:ok"); }
      catch (e: any) {
        out.push("web:" + (e?.statusCode ?? "err"));
        if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from("push_subs").delete().eq("endpoint", s.endpoint); // 만료된 구독 정리
      }
    }
  } else out.push("web:no-vapid");

  // 2) Expo 푸시 (네이티브 앱)
  const { data: members } = await sb.from("room_members").select("uid, push_token").eq("room_id", rec.room_id).neq("uid", rec.from_uid);
  const tokens = (members ?? []).map((m) => m.push_token).filter((t): t is string => !!t && t.startsWith("ExponentPushToken"));
  if (tokens.length) {
    const messages = tokens.map((to) => ({ to, title: "암호쳇", body: text, sound: "default", data: { room: rec.room_id }, priority: "high" }));
    const r = await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(messages) });
    out.push("expo:" + r.status);
  }
  return new Response(JSON.stringify({ sent: out }), { status: 200, headers: { ...cors, "content-type": "application/json" } });
});
