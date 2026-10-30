# ♟️ Chess Vision Trainer

<div align="center">
  <img src="chess-vision-trainer-animated.gif" alt="Chess Vision Trainer animated chessboard" width="700">

  <h3>Train your chess vision. Sharpen your focus. Think ahead.</h3>

  <p><a href="https://shankar-uxcloud.github.io/chess-vision-trainer/"><strong>🚀 Launch Live Demo</strong></a></p>
</div>

Chess Vision Trainer is a static, browser-based chess visualization and attention-training app built with vanilla HTML, CSS, and JavaScript. It includes local progress tracking and optional Supabase authentication.

## Features

- Seven routed views: Dashboard, Training, Mind Palace, Daily Challenge, Analytics, Achievements, and Settings.
- Eight standard training modes: Square Vision, Coordinate Trainer, Reverse Coordinates, Knight Vision, Blindfold Training, Color Recognition, Custom Practice, and ChessVision Daily. Mind Palace is an additional reconstruction challenge.
- Four appearance themes: Dark, Light, Neon, and Heavy Dark.
- Board orientation, coordinates, optional pieces, session timers, pause/resume, results, XP, achievements, rating, and analytics.
- Daily Challenge official attempts and practice replays.
- Browser-local persistence, JSON backup export/import, and session history.
- Optional Supabase sign-in, sign-up, password reset, sign-out, and guest access.
- Responsive layouts, keyboard shortcuts, reduced-motion handling, and a chessboard loading screen.

## Run locally

Requirements: a modern browser. Node.js 22 or later is only required to run the regression tests.

1. Clone this repository:
   ```bash
   git clone https://github.com/shankar-uxcloud/chess-vision-trainer.git
   cd chess-vision-trainer
   ```
2. Open `index.html` directly, or serve the folder with VS Code Live Server.
3. For account features, ensure the Supabase project URL and publishable key in `index.html` match your project. Guest mode can be used without signing in.

## Project structure

```text
chess-vision-trainer/
├── .github/
│   └── workflows/
│       └── regression.yml
├── tests/
│   └── data-validation.test.cjs
├── index.html
├── style.css
├── script.js
├── auth.js
├── data-validation.js
├── chess-vision-trainer-animated.gif
└── README.md
```

- `index.html`: application markup, routed views, authentication and guest UI, loading screen, and script loading order.
- `style.css`: layout, responsive rules, animations, and four theme styles.
- `script.js`: routing, training modes, timers, scoring, analytics, persistence, import/export, and loading behavior.
- `auth.js`: Supabase authentication and guest/session handling.
- `data-validation.js`: dependency-free validation for imported backups and persisted records.
- `tests/`: Node's built-in test-runner regression tests.

## Regression tests

Install Node.js 22+ and run:

```bash
node --check script.js
node --check auth.js
node --check data-validation.js
node --test tests/*.test.cjs
```

GitHub Actions runs the same syntax checks and regression tests on pushes to `main` and audit branches, and on pull requests targeting `main`.

## Weekly leaderboard security (Phase 2)

The shared weekly leaderboard is read-only to authenticated browser clients. Apply both migrations in order:

1. `supabase/migrations/20261026_weekly_leaderboard.sql` (initial table).
2. `supabase/migrations/20261030_weekly_leaderboard_secure.sql` (revokes direct client writes and creates the session ledger/rate limit).

Deploy the server-side function with the Supabase CLI:

```bash
supabase functions deploy weekly-challenge-submit
```

The function verifies the Supabase access token, validates bounded per-answer event records, rate-limits submissions, derives correct-answer totals, accuracy and streaks on the server, calculates points there, and uses a unique (user, session) key to prevent duplicate awards. The service-role key is read only from the Edge Function environment; never copy it into `index.html`, `script.js`, or any other browser asset.

**Trust limitation:** this is not cheat-proof. A static browser client can fabricate a plausible stream of answer events. Server-side derivation prevents clients from directly choosing aggregate accuracy, correct totals or point totals, and prevents direct aggregate-row edits, but cannot prove that a human genuinely performed every submitted action. Stronger proof would require server-authoritative gameplay events or an independently verifiable challenge protocol.

Older local weekly totals remain visible on the device, but only new session records collected after this update can be submitted to the shared leaderboard. Guest scoring remains local.

## Browser regression tests

Install dependencies and Chromium, then run:

```bash
npm install
npx playwright install chromium
npm run test:browser
```

Playwright is a development-only dependency. The browser suite checks actual board dimensions, presets, custom sizing, Fit to Screen, profiles, themes, core modes, viewport bounds, and orientation changes.

## Backup safety

Backups are JSON files exported by the app. Import validation checks the supported version, record structures, numeric bounds, enumerated settings, and file size before applying data. Invalid imports should leave existing progress unchanged. Keep a separate backup before importing unfamiliar files.

## Current maintenance priorities

- Expand automated coverage for training lifecycle, routing/history, Daily Challenge, Mind Palace scoring, and keyboard behavior.
- Perform browser-level checks across all four themes and desktop/mobile viewport sizes.
- Continue consolidating duplicated CSS only when visual regression checks can protect intended overrides.
- Review accessibility, contrast, CDN reliability, and authentication transitions in real browsers.



## Maintenance log

### 2026-10-21 — Training layout regression

- Fixed the gameplay stage so the inactive target/Mind Palace panel stays hidden.
- Kept the active prompt card separate from the chessboard on desktop and stacked them at narrower widths.
- Documented the visibility rule to help prevent the same overlap from returning.


## Maintenance log

### 2026-10-22 — Training layout verification checklist

- Added a focused checklist for validating the target card and board placement after CSS changes.
- Included desktop, tablet, mobile, and Mind Palace mode checks.
- Kept the troubleshooting guidance alongside the project documentation for future regressions.

## Training layout maintenance

The training workspace mounts the target card, Mind Palace card, and chessboard into the gameplay stage. The target and Mind Palace cards share that stage, so only the card for the active mode should be visible.

- Keep the inactive panel's `hidden` class respected by CSS; do not override it with `display: ... !important`.
- On desktop, keep the active target/Mind Palace card and board in separate grid columns.
- At tablet and mobile widths, let the active card and board stack in normal document flow.
- After changing these rules, check Square Vision and Mind Palace in both desktop and narrow viewports.


## Contributing

Please open an issue or pull request with a focused change, a reproduction case for bugs, and the tests performed. Avoid broad CSS rewrites without regression coverage.

## Author

**P SHANKAR**

- GitHub: [@shankar-uxcloud](https://github.com/shankar-uxcloud)
- Repository: [Chess Vision Trainer](https://github.com/shankar-uxcloud/chess-vision-trainer)
- Live demo: [Open application](https://shankar-uxcloud.github.io/chess-vision-trainer/)

---

*Built to make chess visualization practice more accessible.*


## Per-user Vision Rating (Supabase)

Guest ratings remain local to the browser. Signed-in users can keep a separate rating profile in Supabase and sync it across devices. The SQL migration at `supabase/migrations/20261018_user_vision_rating.sql` creates the rating profile/session tables, enables row-level security, and adds authenticated RPC functions. The database calculates rating changes and prevents a session ID from awarding rating twice; sessions with fewer than five answers do not change rating.

**One-time setup:** Open the Supabase project configured in `auth.js`, select **SQL Editor**, paste and run the migration file, then sign in to the app. Until this SQL is run, account-level sync is unavailable and the app retains local ratings. Guest mode continues to work locally.
