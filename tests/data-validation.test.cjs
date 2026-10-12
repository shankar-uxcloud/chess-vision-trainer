"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { validateStats, validateHistory, validateAnswerRecords, validateBackup } = require("../data-validation.js");

const baseBackup = () => ({
  version: 3.9,
  stats: { totalCorrect: 5, totalMistakes: 2, bestStreak: 3, personalBest: 5, totalSessions: 1, flawless: 0, totalTime: 30, totalQuestions: 7 },
  history: [{ correct: 5, mistakes: 2, accuracy: 71, bestStreak: 3, duration: 30, mode: "square", perspective: "white", xp: 45, date: "2026-10-12T12:00:00.000Z" }],
  answerRecords: [{ targetSquare: "e4", square: "e4", correct: true, reactionTime: 500, mode: "square", perspectiveSide: "white", flipChallenge: false, questionType: "coordinate", sessionId: "session-1", timestamp: "2026-10-12T12:00:00.000Z", difficulty: "normal", attempt: 1 }],
  visionRating: { current: 1000, history: [] }, xp: 45, unlocked: ["first"],
  daily: { date: "2026-10-12", count: 5 },
  dailyChallenge: { date: "2026-10-12", attempts: [], streak: 0, lastCompletedDate: null },
  settings: { theme: "light", board: "emerald", perspective: "white", flip: false, labels: false, coords: true, pieces: false, sound: true, volume: 0.6, ticks: true, boardSize: 100, musicVolume: 0.5, musicTrack: 0, musicSource: "stream", musicWidget: { x: 0, y: 0 }, mpDifficulty: "beginner", adaptive: false, adaptiveIntensity: "balanced" }
});

test("accepts a supported complete backup", () => {
  assert.equal(validateBackup(baseBackup()).history.length, 1);
});
test("rejects unsupported versions and malformed statistics", () => {
  const badVersion = baseBackup(); badVersion.version = 99;
  assert.throws(() => validateBackup(badVersion), /Unsupported backup version/);
  assert.equal(validateStats({ totalCorrect: -1 }), null);
});
test("rejects invalid history records and unsafe answer records", () => {
  const badHistory = baseBackup(); badHistory.history[0].date = "not-a-date";
  assert.throws(() => validateBackup(badHistory), /invalid session history/i);
  assert.equal(validateAnswerRecords([{ targetSquare: "<img>", correct: true }]), null);
});
test("rejects an import as a whole rather than partially applying it", () => {
  const bad = baseBackup(); bad.answerRecords.push({ targetSquare: "e9" });
  assert.throws(() => validateBackup(bad), /invalid answer records/i);
});
test("clamps bounded settings to safe ranges", () => {
  const data = baseBackup(); data.settings.volume = 9; data.settings.musicVolume = -3; data.settings.boardSize = 1000;
  const clean = validateBackup(data);
  assert.equal(clean.settings.volume, 1);
  assert.equal(clean.settings.musicVolume, 0);
  assert.equal(clean.settings.boardSize, 150);
});
test("preserves a valid exported daily challenge structure", () => {
  const data = baseBackup();
  data.dailyChallenge.attempts.push({ official: true, score: 10, correct: 5, accuracy: 25, completionTime: 20, streak: 3, ratingDelta: 2, completedAt: "2026-10-12T12:00:00.000Z", dailyStreak: 1 });
  assert.equal(validateBackup(data).dailyChallenge.attempts.length, 1);
});
