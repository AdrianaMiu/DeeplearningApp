# Deep Learning Companion

An offline-capable personal learning application for the full *Dive into Deep Learning* curriculum. It publishes 32 reviewed learning entries: twelve detailed lessons and twenty chapter/appendix studios, with 120 reviewed assessment items (112 lesson/studio questions and eight diagnostic items).

Live target: `https://adrianamiu.github.io/DeeplearningApp/`

## What is included

- Core learning paths for all 20 chapters and both appendices (22 paths). Chapters 2–3 have detailed lessons; the other chapters and appendices have studios. Each studio has four mixed chapter checks and a mathematical or decision interaction.
- Appendix A covers §A.1–A.11; Appendix B covers §B.1–B.8. The full source inventory remains metadata: companion coverage does not mark every source section converted or visually reviewed.
- A learning cockpit, guided stages, practice modes, diagnostic, spaced review, evidence-based progress, local notes, and a downloadable PyTorch regression notebook.
- Local-first attempts, sessions, notes, review events, settings, and versioned JSON backup/restore in IndexedDB; published content and lazy studios work offline after the app is cached.
- Optional Gemini tutoring through a separate Cloudflare Worker. Reviewed companion explanations work without a retrieval store; book-grounded responses require private provisioning and verified citations. The learning app works without a tutor service.
- GitHub Pages under `/DeeplearningApp/`, hash routes, and a scoped service worker with an explicit update notice.

The PDF, extracted book prose, verbatim exercise prompts, keys, local databases, private retrieval manifests, and `config/` are excluded from publication.

## Local development and verification

Use Node 22, npm, and Python 3. Poppler (`pdfinfo` and `pdftotext`) is needed only for local source/inventory work. No API key, Cloudflare account, or retrieval store is required for the normal build or tests.

```bash
npm ci
npm run dev
```

Run the release checks using the installed browser (install Chromium once with `npx playwright install chromium` if needed):

```bash
npm run typecheck
npm test
python3 -B -m unittest discover -s tests/rag -p '*_test.py'
python3 -B -m unittest discover -s tests/scripts -p '*_test.py'
npm run build
npm run test:e2e
WRANGLER_LOG_PATH=/tmp/d2l-wrangler.log npx wrangler deploy --dry-run --config worker/wrangler.jsonc --outdir /tmp/d2l-worker-dry-run
python3 -B scripts/verify_release.py --dist dist --worker-out /tmp/d2l-worker-dry-run
```

The production preview uses `/DeeplearningApp/`. Unit tests enforce the 32 entries, 120 assessment items, and 22 core paths. The release audit checks tracked-file/private-file exclusions, recognizable secret signatures, selected build outputs, Pages asset URLs/manifest scope, and optional Worker RAG configuration. It reports filenames only; it is a guard, not proof that arbitrary prose or every possible secret format is absent. Review publication inputs as well. CI never ingests the book or contacts Gemini.

## Source inventory and review records

Keep the PDF local. Its pinned SHA-256 is `93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56` (1,185 pages).

```bash
python3 -B scripts/extract_inventory.py /absolute/path/2106.11342v5.pdf src/content/generated-inventory.json
python3 -B scripts/verify_studio_sources.py --pdf /absolute/path/2106.11342v5.pdf --inventory src/content/generated-inventory.json --reviewed-manifest src/content/studio-source-manifest.json --out src/content/studio-source-manifest.json
```

The generated inventory contains headings, page mappings, status, and exercise references. Studio verification checks source hash/page count and reference locations, then preserves supplied review records unchanged. It never performs a visual check or assigns a fresh review date. Changed source identity/references require a person to inspect rendered pages and supply reviewed metadata before regeneration; do not treat a script run as that attestation.

## Deploy Pages and the tutor

Pages Settings must use **GitHub Actions**. Push to `main` or dispatch `.github/workflows/pages.yml`; the workflow runs typing, the complete unit suite, production build, browser tests, and the release audit before uploading `dist`. Configure the existing repository secrets `VITE_TUTOR_URL` and `VITE_TURNSTILE_SITE_KEY` only to enable the public tutor endpoint/site key in the browser. Copy `.env.example` to ignored `.env` for those public values during local development. Never put provider credentials or store identifiers in `VITE_` values.

The separate Worker workflow runs typing, Worker/tutor tests, a dry-run bundle and audit before deployment. It deploys only when the existing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets are configured. `GEMINI_API_KEY` and `TURNSTILE_SECRET` remain Cloudflare Worker secrets. See [Worker setup, configuration and rollback](worker/README.md). Deployment does not provision retrieval or change billing.

For Pages rollback, select a known-good source commit and use GitHub's revert/PR flow to restore it on `main`; let the same checks rebuild and publish that revision. Confirm repository-base assets and offline navigation afterward. The service worker presents updates when the new version is ready; existing tabs may keep their current version until accepted/reloaded. Export progress before a major rollback: browser data is versioned separately, and an older app may not understand newer data. A rollback must not clear learner storage or rewrite backup versions.

## Private book retrieval

Retrieval is optional and disabled in the committed Worker configuration. Live provisioning and remote verification have **not** been performed: this implementation environment has neither an administrative `GEMINI_API_KEY` nor a private `.rag/manifest.json`. No live-latency, quota, or remote-coverage claim follows from offline tests.

An administrator must obtain consent to send the book to Google, provision the key in the administrative process environment via a secret manager, then run:

```bash
python3 -B scripts/rag/index_book.py create --pdf /absolute/path/2106.11342v5.pdf --dry-run
python3 -B scripts/rag/index_book.py create --pdf /absolute/path/2106.11342v5.pdf
python3 -B scripts/rag/index_book.py verify --pdf /absolute/path/2106.11342v5.pdf
```

Only after `verify` succeeds, configure the three Worker-only retrieval values together as documented in [private retrieval administration](scripts/rag/README.md). That guide contains exact scoped reindex, resume/reconciliation, verification, and double-confirmed `delete-store` commands. Keep `.rag/manifest.json` private for maintenance and deletion. CI does not require a store. Removing `GEMINI_FILE_SEARCH_STORE`, or a missing/mismatched source/version assertion, selects the reviewed companion fallback; it must not be presented as book-grounded evidence.

Gemini processes indexed book documents and submitted conversation context. Free-tier data may be used by Google to improve its products; do not submit personal or sensitive information. Indexing and generation have separate quotas/costs; keep billing unchanged unless explicitly authorized. Browser reset deletes local learning data only: it does **not** delete the remote File Search store. Follow the retrieval guide's explicit remote deletion procedure to remove that data.

## Privacy, backups, and evidence

Learning data stays in the browser. Tutor context is sent only after the learner opens the tutor, accepts its disclosure, completes Turnstile, and asks a question. Application code does not log prompts or answers.

Use **Settings → Download progress JSON** before reset or replace. Import presents a preview with merge or replace. Merge ignores duplicate attempt/review UUIDs and preserves distinct evidence. Saved lesson sessions with the same ID use the newest `updatedAt` record (equal timestamps keep the local record); settings also use the newest record. Notes with existing IDs remain local. A service worker update does not reset progress.

Content states are `unconverted` (indexed source), `drafted` (awaiting review), `reviewed` (checked companion material), and `published` (approved for release). Mastery uses evidence: Demonstrated requires two distinct unassisted successes including an application item; Retained additionally requires a later unseen unassisted check after at least seven days.
