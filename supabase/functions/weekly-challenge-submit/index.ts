// Weekly challenge submission endpoint. All totals and points are calculated here.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function isoWeekKey(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return d.getUTCFullYear() + "-W" + String(week).padStart(2, "0");
}

function allowedWeek(key: string) {
  const now = new Date();
  const candidates = [-7, 0, 7].map(offset => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() + offset);
    return isoWeekKey(date);
  });
  return candidates.includes(key);
}

function validSession(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return typeof value.sessionId === "string" && value.sessionId.trim().length > 0 &&
    value.sessionId.length <= 200 &&
    Number.isSafeInteger(value.correct) && value.correct >= 0 && value.correct <= 10000 &&
    typeof value.accuracy === "number" && Number.isFinite(value.accuracy) && value.accuracy >= 0 && value.accuracy <= 100 &&
    Number.isSafeInteger(value.bestStreak) && value.bestStreak >= 0 && value.bestStreak <= 10000 &&
    Number.isSafeInteger(value.durationSeconds) && value.durationSeconds >= 0 && value.durationSeconds <= 86400 &&
    ["square", "coordinate", "reverse", "knight", "blindfold", "color", "custom", "daily"].includes(value.mode) &&
    typeof value.completedAt === "string" && Number.isFinite(Date.parse(value.completedAt));
}

function calculatePoints(session: any) {
  const correct = session.correct;
  const accuracy = session.accuracy;
  const streak = Math.min(session.bestStreak, 25);
  return correct * 10 + (accuracy >= 90 ? 25 : 0) + (accuracy === 100 ? 25 : 0) + streak * 2;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, message: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === authorization) return json({ ok: false, message: "Authentication required." }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ ok: false, message: "Server configuration is incomplete." }, 500);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: userData, error: authError } = await userClient.auth.getUser(token);
  const user = userData?.user;
  if (authError || !user) return json({ ok: false, message: "Invalid or expired session." }, 401);

  let body: any;
  try { body = await request.json(); }
  catch { return json({ ok: false, message: "Invalid JSON payload." }, 400); }

  const weekKey = body?.weekKey;
  const sessions = body?.sessions;
  if (typeof weekKey !== "string" || !/^\d{4}-W\d{2}$/.test(weekKey) || !allowedWeek(weekKey)) {
    return json({ ok: false, message: "The requested weekly season is invalid or expired." }, 400);
  }
  if (!Array.isArray(sessions) || sessions.length < 1 || sessions.length > 20 || !sessions.every(validSession)) {
    return json({ ok: false, message: "Submit between 1 and 20 valid completed session records." }, 400);
  }

  const { data: allowed, error: limitError } = await userClient.rpc("claim_cvt_weekly_submission_slot");
  if (limitError) return json({ ok: false, message: "Could not validate submission rate." }, 429);
  if (allowed !== true) return json({ ok: false, message: "Please wait before syncing another batch." }, 429);

  for (const session of sessions) {
    const points = calculatePoints(session);
    const { error } = await admin.from("cvt_weekly_challenge_sessions").upsert({
      user_id: user.id,
      week_key: weekKey,
      session_id: session.sessionId,
      mode: session.mode,
      correct: session.correct,
      accuracy: session.accuracy,
      best_streak: session.bestStreak,
      duration_seconds: session.durationSeconds,
      points,
      completed_at: new Date(session.completedAt).toISOString()
    }, { onConflict: "user_id,session_id", ignoreDuplicates: true });
    if (error) return json({ ok: false, message: "Could not store the session record." }, 500);
  }

  const { data: rows, error: readError } = await admin.from("cvt_weekly_challenge_sessions")
    .select("points,correct")
    .eq("user_id", user.id)
    .eq("week_key", weekKey);
  if (readError) return json({ ok: false, message: "Could not calculate weekly totals." }, 500);

  const totals = (rows || []).reduce((sum: any, row: any) => ({
    points: sum.points + Number(row.points || 0),
    sessions: sum.sessions + 1,
    correct: sum.correct + Number(row.correct || 0)
  }), { points: 0, sessions: 0, correct: 0 });

  const metadata = user.user_metadata || {};
  const candidate = metadata.display_name || metadata.full_name || metadata.name || user.email?.split("@")[0] || "Chess Player";
  const displayName = String(candidate).trim().slice(0, 60) || "Chess Player";
  const { error: boardError } = await admin.from("cvt_weekly_leaderboard").upsert({
    user_id: user.id,
    week_key: weekKey,
    display_name: displayName,
    points: totals.points,
    sessions: totals.sessions,
    correct: totals.correct,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id,week_key" });
  if (boardError) return json({ ok: false, message: "Could not update the leaderboard." }, 500);

  return json({ ok: true, duplicateSafe: true, totals });
});
