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
