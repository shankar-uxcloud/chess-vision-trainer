"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "20261025_player_profiles.sql");
const migration = fs.readFileSync(migrationPath, "utf8");

test("player profile migration enables row-level security", () => {
  assert.match(migration, /alter table public\.cvt_player_profiles enable row level security/i);
});

test("profile reads are restricted to the authenticated owner", () => {
  assert.match(migration, /for select\s+to authenticated\s+using\s*\(auth\.uid\(\)\s*=\s*user_id\)/i);
});

test("profile inserts and updates are restricted to the authenticated owner", () => {
  assert.match(migration, /for insert\s+to authenticated\s+with check\s*\(auth\.uid\(\)\s*=\s*user_id\)/i);
  assert.match(migration, /for update\s+to authenticated\s+using\s*\(auth\.uid\(\)\s*=\s*user_id\)\s+with check\s*\(auth\.uid\(\)\s*=\s*user_id\)/i);
});

test("profile data is keyed to an auth user and display names are bounded", () => {
  assert.match(migration, /user_id uuid primary key references auth\.users\(id\) on delete cascade/i);
  assert.match(migration, /char_length\(display_name\) between 1 and 60/i);
  assert.match(migration, /progress jsonb not null/i);
});
