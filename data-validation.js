/* Shared backup and persisted-data validation for Chess Vision Trainer.
 * Works as a browser global and as a dependency-free CommonJS module for tests.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.CVTBackupValidation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";
    const MODES = new Set(["square", "coordinate", "reverse", "knight", "blindfold", "color", "custom", "daily", "mindpalace"]);
    const PERSPECTIVES = new Set(["white", "black", "mixed", "both", "auto"]);
    const THEMES = new Set(["dark", "light", "neon", "heavy"]);
    const BOARDS = new Set(["emerald", "walnut", "ice", "rose", "midnight", "classic"]);
    const MP_DIFFICULTIES = new Set(["beginner", "focus", "memory", "blindfold", "grandmaster"]);
    const ADAPTIVE = new Set(["balanced", "focus", "aggressive"]);
    const STAT_KEYS = ["totalCorrect", "totalMistakes", "bestStreak", "personalBest", "totalSessions", "flawless", "totalTime", "totalQuestions"];
    const ACHIEVEMENTS = new Set(["first", "streak10", "streak25", "streak50", "c100", "c500", "c1000", "sess20", "sess40", "sess10", "sess50", "perfect"]);
    const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value) &&
        (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
    const finite = value => typeof value === "number" && Number.isFinite(value);
    const integerIn = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
    const validDate = value => typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value));
    const assert = (condition, message) => { if (!condition) throw new Error(message); };

    function validateStats(value) {
        if (!isObject(value)) return null;
        const result = {};
        for (const key of STAT_KEYS) {
            const n = value[key] === undefined ? 0 : value[key];
            if (!integerIn(n, 0, 1000000000)) return null;
            result[key] = n;
        }
        return result;
    }
    function validateHistory(value) {
        if (!Array.isArray(value) || value.length > 50) return null;
        const rows = [];
        for (const row of value) {
            if (!isObject(row) || !integerIn(row.correct, 0, 1000000000) ||
                !integerIn(row.mistakes, 0, 1000000000) ||
                !finite(row.accuracy) || row.accuracy < 0 || row.accuracy > 100 ||
                !finite(row.duration) || row.duration < 0 || row.duration > 31536000 ||
                !MODES.has(row.mode) || !PERSPECTIVES.has(row.perspective || "white") ||
                !validDate(row.date)) return null;
            const clean = {
                correct: row.correct, mistakes: row.mistakes, accuracy: row.accuracy,
                bestStreak: integerIn(row.bestStreak, 0, 1000000000) ? row.bestStreak : 0,
                duration: row.duration, mode: row.mode, perspective: row.perspective || "white",
                xp: integerIn(row.xp, 0, 1000000000) ? row.xp : 0, date: row.date
            };
            for (const key of ["avgReaction", "rating", "ratingDelta", "ratingPerformance", "score", "dailyNumber", "visionScore"]) {
                if (row[key] !== undefined) {
                    if (!finite(row[key]) || Math.abs(row[key]) > 1000000000) return null;
                    clean[key] = row[key];
                }
            }
            if (row.official !== undefined) {
                if (typeof row.official !== "boolean") return null;
                clean.official = row.official;
            }
            rows.push(clean);
        }
        return rows;
    }
    function validateAnswerRecords(value) {
        if (!Array.isArray(value) || value.length > 5000) return null;
        const rows = [];
        for (const row of value) {
            if (!isObject(row) || typeof row.targetSquare !== "string" ||
                !/^[a-h][1-8]$/.test(row.targetSquare) || typeof row.correct !== "boolean" ||
                !finite(row.reactionTime) || row.reactionTime < 0 || row.reactionTime > 3600000 ||
                !MODES.has(row.mode) || !PERSPECTIVES.has(row.perspectiveSide) ||
                typeof row.sessionId !== "string" || row.sessionId.trim().length === 0 || row.sessionId.length > 200 ||
                !validDate(row.timestamp)) return null;
            if (row.square !== undefined && (typeof row.square !== "string" || !/^[a-h][1-8]$/.test(row.square))) return null;
            if (row.flipChallenge !== undefined && typeof row.flipChallenge !== "boolean") return null;
            if (row.attempt !== undefined && !integerIn(row.attempt, 0, 1000000000)) return null;
            rows.push({ ...row });
        }
        return rows;
    }
    function validateBackup(input) {
        assert(isObject(input), "Backup must be a JSON object.");
        assert(finite(input.version) && input.version >= 3 && input.version <= 3.9,
            "Unsupported backup version. Export a backup from a supported Chess Vision Trainer version.");
        assert(input.stats !== undefined, "Backup is missing statistics.");
        const stats = validateStats(input.stats);
        assert(stats, "Backup contains invalid statistics.");
        assert(input.history !== undefined, "Backup is missing session history.");
        const history = validateHistory(input.history);
        assert(history, "Backup contains invalid session history.");
        const answerRecords = input.answerRecords === undefined ? [] : validateAnswerRecords(input.answerRecords);
        assert(answerRecords, "Backup contains invalid answer records.");
        const result = { version: input.version, stats, history, answerRecords };

        if (input.visionRating !== undefined) {
            assert(isObject(input.visionRating) && finite(input.visionRating.current) &&
                input.visionRating.current >= 400 && input.visionRating.current <= 2400 &&
                Array.isArray(input.visionRating.history) && input.visionRating.history.length <= 100,
                "Backup contains invalid vision rating data.");
            result.visionRating = { current: Math.round(input.visionRating.current), history: input.visionRating.history };
        }
        if (input.xp !== undefined) {
            assert(integerIn(input.xp, 0, 1000000000), "Backup contains invalid XP.");
            result.xp = input.xp;
        }
        if (input.unlocked !== undefined) {
            assert(Array.isArray(input.unlocked) && input.unlocked.length <= ACHIEVEMENTS.size &&
                input.unlocked.every(id => typeof id === "string" && ACHIEVEMENTS.has(id)),
                "Backup contains invalid achievements.");
            result.unlocked = [...new Set(input.unlocked)];
        }
        if (input.daily !== undefined) {
            assert(isObject(input.daily) && validDate(input.daily.date) &&
                integerIn(input.daily.count, 0, 1000000000), "Backup contains invalid daily progress.");
            result.daily = { date: input.daily.date, count: input.daily.count };
        }
        if (input.dailyChallenge !== undefined) {
            const dc = input.dailyChallenge;
            assert(isObject(dc) && validDate(dc.date) && Array.isArray(dc.attempts) &&
                dc.attempts.length <= 20 && integerIn(dc.streak, 0, 1000000) &&
                (dc.lastCompletedDate === null || dc.lastCompletedDate === undefined || validDate(dc.lastCompletedDate)),
                "Backup contains invalid Daily Challenge data.");
            const attempts = dc.attempts.map(a => {
                assert(isObject(a) && typeof a.official === "boolean" &&
                    integerIn(a.score, 0, 1000000) && integerIn(a.correct, 0, 1000000) &&
                    finite(a.accuracy) && a.accuracy >= 0 && a.accuracy <= 100 &&
                    finite(a.completionTime) && a.completionTime >= 0 && a.completionTime <= 31536000 &&
                    integerIn(a.streak, 0, 1000000) && finite(a.ratingDelta) &&
                    validDate(a.completedAt), "Backup contains an invalid Daily Challenge attempt.");
                return { ...a };
            });
            result.dailyChallenge = { date: dc.date, attempts, streak: dc.streak, lastCompletedDate: dc.lastCompletedDate || null };
        }
        if (input.settings !== undefined) {
            const s = input.settings;
            assert(isObject(s), "Backup settings must be an object.");
            assert(THEMES.has(s.theme) && BOARDS.has(s.board) && PERSPECTIVES.has(s.perspective) &&
                typeof s.flip === "boolean" && typeof s.labels === "boolean" && typeof s.coords === "boolean" &&
                typeof s.pieces === "boolean" && typeof s.sound === "boolean" && typeof s.ticks === "boolean" &&
                finite(s.volume) && finite(s.boardSize) && finite(s.musicVolume) &&
                integerIn(s.musicTrack, 0, 100) && ["stream", "local"].includes(s.musicSource) &&
                MP_DIFFICULTIES.has(s.mpDifficulty) && typeof s.adaptive === "boolean" &&
                ADAPTIVE.has(s.adaptiveIntensity), "Backup contains invalid settings.");
            const widget = s.musicWidget === undefined ? { x: 0, y: 0 } : s.musicWidget;
            assert(isObject(widget) && finite(widget.x) && finite(widget.y), "Backup contains invalid music widget position.");
            if (s.boardFit !== undefined) assert(typeof s.boardFit === "boolean", "Backup contains invalid Fit to Screen preference.");
            if (s.settingsProfile !== undefined) assert(["balanced", "focus", "performance", "custom"].includes(s.settingsProfile), "Backup contains invalid recommended profile.");
            if (s.animations !== undefined) assert(typeof s.animations === "boolean", "Backup contains invalid animation preference.");
            result.settings = { ...s,
                volume: Math.min(1, Math.max(0, s.volume)),
                musicVolume: Math.min(1, Math.max(0, s.musicVolume)),
                boardSize: Math.min(130, Math.max(60, s.boardSize)),
                musicWidget: { x: Math.min(10000, Math.max(-10000, widget.x)), y: Math.min(10000, Math.max(-10000, widget.y)) }
            };
        }
        return result;
    }
    return { validateStats, validateHistory, validateAnswerRecords, validateBackup };
});
