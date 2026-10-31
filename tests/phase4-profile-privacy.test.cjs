"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const migration = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "20261031_phase4_public_profiles.sql"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const script = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

test("existing player rows are preserved and private by default", () => {
  assert.match(migration, /add column if not exists profile_public boolean not null default false/i);
  assert.match(migration, /add column if not exists show_stats boolean not null default false/i);
  assert.match(migration, /add column if not exists username text/i);
});

test("username format is enforced in the database and uniqueness is case insensitive", () => {
  assert.match(migration, /username = lower\(username\)/i);
  assert.match(migration, /username ~ '\^\[a-z0-9\]\[a-z0-9_\]\{2,19\}\$'/i);
  assert.match(migration, /unique index if not exists cvt_player_profiles_username_unique\s+on public\.cvt_player_profiles \(lower\(username\)\)/i);
});

test("public lookup requires authentication and returns only explicitly public profiles", () => {
  assert.match(migration, /v_user_id uuid := auth\.uid\(\)/i);
  assert.match(migration, /and p\.profile_public = true/i);
  assert.match(migration, /revoke all on function public\.find_public_player_profile\(text\) from public, anon/i);
  assert.match(migration, /grant execute on function public\.find_public_player_profile\(text\) to authenticated/i);
  assert.doesNotMatch(migration, /email/i);
});

test("profile UI exposes separate visibility controls", () => {
  assert.match(html, /id="playerUsername"/);
  assert.match(html, /id="playerProfilePublic"/);
  assert.match(html, /id="playerProfileShowStats"/);
  assert.match(html, /id="profilePrivacyNote"/);
});

test("profile sync persists username and privacy preferences", () => {
  assert.match(script, /username: profileUsername \|\| null/);
  assert.match(script, /profile_public: profileIsPublic/);
  assert.match(script, /show_stats: profileShowStats/);
  assert.match(script, /select\("display_name,username,profile_public,show_stats,progress,updated_at"\)/);
});

test("public player search uses exact username RPC and safely renders returned fields", () => {
  assert.match(html, /id="publicPlayerUsername"/);
  assert.match(html, /id="searchPublicPlayer"/);
  assert.match(script, /client\.rpc\("find_public_player_profile", \{ p_username: username \}\)/);
  assert.match(script, /No public profile found for that exact username/);
  assert.match(script, /player has chosen not to share training statistics/);
});
