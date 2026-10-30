"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const sql=fs.readFileSync(path.join(__dirname,"..","supabase","migrations","20261026_weekly_leaderboard.sql"),"utf8");

test("weekly leaderboard is tied to auth users and unique per season",()=>{
 assert.match(sql,/user_id uuid not null references auth\.users\(id\) on delete cascade/i);
 assert.match(sql,/primary key \(user_id, week_key\)/i);
 assert.match(sql,/week_key text not null check/i);
});
test("leaderboard enables row-level security and only owners can write",()=>{
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/for select to authenticated using \(true\)/i);
 assert.match(sql,/for insert to authenticated with check \(auth\.uid\(\) = user_id\)/i);
 assert.match(sql,/for update to authenticated\s+using \(auth\.uid\(\) = user_id\) with check \(auth\.uid\(\) = user_id\)/i);
});
test("weekly score fields have non-negative bounds and display names are limited",()=>{
 assert.match(sql,/char_length\(display_name\) between 1 and 60/i);
 assert.match(sql,/points integer not null default 0 check \(points >= 0/i);
 assert.match(sql,/sessions integer not null default 0 check \(sessions >= 0/i);
});

const secureSql=fs.readFileSync(path.join(__dirname,"..","supabase","migrations","20261030_weekly_leaderboard_secure.sql"),"utf8");
const edgeFunction=fs.readFileSync(path.join(__dirname,"..","supabase","functions","weekly-challenge-submit","index.ts"),"utf8");

test("security migration removes authenticated client write policies and grants reads only",()=>{
 assert.match(secureSql,/drop policy if exists "Players can insert their own weekly score"/i);
 assert.match(secureSql,/drop policy if exists "Players can update their own weekly score"/i);
 assert.match(secureSql,/revoke insert, update, delete on public\.cvt_weekly_leaderboard from anon, authenticated/i);
 assert.match(secureSql,/grant select on public\.cvt_weekly_leaderboard to authenticated/i);
 assert.match(secureSql,/add column if not exists score_version integer not null default 0/i);
});

test("weekly session ledger deduplicates by user and session and is not client writable",()=>{
 assert.match(secureSql,/primary key \(user_id, session_id\)/i);
 assert.match(secureSql,/revoke all on public\.cvt_weekly_challenge_sessions from anon, authenticated/i);
 assert.match(secureSql,/claim_cvt_weekly_submission_slot/i);
});

test("Edge Function derives the authenticated user and calculates points on the server",()=>{
 assert.match(edgeFunction,/auth\.getUser\(token\)/);
 assert.match(edgeFunction,/function calculateMetrics\(session: any\)/);
 assert.match(edgeFunction,/answers\.filter\(\(answer: any\) => answer\.correct\)\.length/);
 assert.match(edgeFunction,/function calculatePoints\(metrics: any\)/);
 assert.match(edgeFunction,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(edgeFunction,/ignoreDuplicates: true/);
 assert.doesNotMatch(edgeFunction,/body\.user_id|body\.points|body\.correct|body\.accuracy|body\.bestStreak|body\.durationSeconds/);
});
