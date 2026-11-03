# Deep Learning Companion

An offline-capable personal learning application for the full *Dive into Deep Learning* curriculum. The source book is indexed end to end; v1 publishes twelve reviewed lessons, forty reviewed questions, three mathematical interactions, a diagnostic, spaced review, evidence-based progress, notes, and a downloadable PyTorch regression notebook.

Live target: `https://adrianamiu.github.io/DeeplearningApp/`

## What is included

- All 20 chapters, Appendix A (§A.1–A.11), Appendix B (§B.1–B.8), orientations, and exercise references as metadata.
- Reviewed companion lessons for Chapter 2 and early Chapter 3. Remaining material is honestly labeled unconverted.
- Local-first attempts, sessions, notes, review events, settings, and versioned JSON backup/restore in IndexedDB.
- Broadcasting, gradient/tangent, and regression-line interactions with keyboard controls and equivalent tables.
- Optional grounded Gemini tutoring through a separately deployed Cloudflare Worker. The app is fully usable without it.
- GitHub Pages deployment under the repository base path and a scoped service worker.

The PDF, verbatim exercise prompts, API keys, local databases, `config/`, and environment secrets are intentionally excluded.

## Local development

Requirements: Node 22, npm, Python 3, Poppler (`pdftotext`) only when regenerating the source inventory.

```bash
npm ci
npm run dev
```

Quality gates:

```bash
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The production preview is served under `/DeeplearningApp/`, matching GitHub Pages.

## Source inventory

The source PDF is local-only and must match SHA-256:

```text
93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56
```

Regenerate metadata without committing the PDF or extracted prose:

```bash
python3 scripts/extract_inventory.py 2106.11342v5.pdf src/content/generated-inventory.json
```

The generated public file contains headings, page mappings, status, and exercise references—not exercise text.

## Tutor Worker

Copy `.env.example` to a local ignored `.env` only for public browser values. Never put the Gemini API key in a Vite variable.

Authenticate Wrangler, then store server secrets interactively:

```bash
npx wrangler login
npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.jsonc
npx wrangler secret put TURNSTILE_SECRET --config worker/wrangler.jsonc
npx wrangler deploy --config worker/wrangler.jsonc
```

Wrangler auto-provisions the `DAILY_LIMITS` KV namespace. The Worker accepts only reviewed lesson IDs, verifies Turnstile, limits each anonymous client to approximately five requests per minute and 25 per day, and caps the global daily allowance at 250. Prompt bodies and responses are not logged by application code.

For Actions deployment, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets. `GEMINI_API_KEY` and `TURNSTILE_SECRET` remain Worker secrets in Cloudflare.

## Privacy and backups

Learning data stays in the browser. Tutor context is sent only after the learner opens the tutor, accepts the disclosure, completes Turnstile, and asks a question. Gemini free-tier prompts may be used by Google for product improvement, so personal or sensitive information should not be submitted.

Use **Settings → Download progress JSON** before reset or replace. Import always presents a preview, then offers merge or replace. Merge ignores identical UUIDs and preserves distinct evidence.

## Deployment

`.github/workflows/pages.yml` uses the official Pages artifact flow. It runs strict typing, unit/component tests, and a production build before deployment. Hash routes make refreshes safe under the repository path.

The Worker workflow is separate and skips deployment until Cloudflare credentials exist. Billing should remain disabled unless the repository owner explicitly opts in.

## Content status

- `unconverted`: indexed source only
- `drafted`: companion content awaiting review
- `reviewed`: checked companion lesson or assessment
- `published`: reviewed content approved for release

Mastery is never set by a checkbox. Demonstrated requires two distinct unassisted successes including an application item; retained additionally requires a later unseen unassisted check after at least seven days.
