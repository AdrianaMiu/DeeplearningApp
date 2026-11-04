# Private book retrieval administration

The browser never uploads the book. This local Python 3 CLI reads the pinned PDF, extracts section documents into an OS temporary directory, and optionally sends those documents to a private Gemini File Search store. The Worker queries only its reviewed lesson allowlist. The browser receives the existing concise tutor fields, an optional `grounding: 'book' | 'companion'` discriminator, and server-verified section/page references; it never receives a store name or book excerpts. Older responses without the discriminator display Companion explanation. Citations show printed and PDF pages.

## Requirements and first dry run

Use the existing project dependencies, Python 3 standard library, and Poppler's `pdfinfo`/`pdftotext` tools. No Python packages are required. The PDF must match SHA-256 `93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56` and 1,185 pages. Identity is checked before extraction. Do not commit the PDF.

```sh
python3 -B scripts/rag/index_book.py create --pdf /absolute/path/2106.11342v5.pdf --dry-run
```

Dry run does not read credentials, call Google, write a resume manifest, or leave extracted files behind. It reports only metadata/counts. The checked source currently produces 737 document sections, 282 exclusions, zero containers, and zero blocked sections, accounting for all 1,019 inventory sections. Of the exclusions, 280 are headings titled Summary or Exercises. Two are verified empty source placeholders: 13.2.2 and 13.2.3 on PDF page 615 / printed page 575. Their narrowly pinned review record lives in `reviewed-exclusions.json`. Any other empty leaf or ambiguous heading blocks upload.

## Boundary fidelity

The inventory is an anchor, not a page slicing recipe. Extraction matches each section ID and normalized heading on its recorded PDF page, then ends at the next actual numbered heading. Multiple headings on one page therefore have separate character boundaries. A parent's direct introduction is a separate document from child sections; child prose is never duplicated into the parent. Headings titled Summary and Exercises still terminate preceding documents but their content is excluded. An empty parent with child sections receives container coverage metadata rather than fabricated prose. Chapter-record start pages are never used as boundaries.

Each section records `sourceHash`, `contentVersion`, `chapterId`, `sectionId`, separate printed/PDF start/end positions, and a text digest. The pinned edition's constant printed/PDF offset is retained for end pages. All extracted documents are labelled `heading-aligned-unreviewed`: heading alignment is verified, but automated extraction does not prove mathematical notation, tables, or code are visually faithful. Visually check relevant equations against the PDF before relying on retrieved mathematical passages. The studio content review does not imply every extracted section was visually reviewed.

## Create and resume

Provision `GEMINI_API_KEY` in the administrative process environment using your normal secret manager. Do not paste it into a command argument, committed file, browser `.env`, or logs. These commands incur indexing requests; no live requests were performed during implementation.

```sh
python3 -B scripts/rag/index_book.py create --pdf /absolute/path/2106.11342v5.pdf
python3 -B scripts/rag/index_book.py verify --pdf /absolute/path/2106.11342v5.pdf
```

The default private resume manifest is `.rag/manifest.json` (ignored, mode 0600). It stores metadata, document IDs, and operation IDs, never extracted prose or credentials. Its public format is `manifest.schema.json`. Keep it for resume and deletion. One administrator should operate a manifest/store at a time; concurrent writers are not supported.

A rerun reconciles remote metadata and content digests, skips matching active documents, and resumes recorded indexing operations. Journal state is saved before uploading. If a connection fails after Google may have accepted a mutation but before its operation/name was saved, the CLI stops with an uncertain-outcome message instead of blindly creating duplicates. Inspect the private Google store; restore the exact operation/store identifier in the private manifest or supply `--store fileSearchStores/EXACT_NAME` for a known created store. Do not clear pending state until the remote outcome is known. Do not share upload-session URLs.

Chunks use at most 400 whitespace tokens with 60-token overlap, configured on Google's upload API and recorded in the manifest. Uploads use the resumable protocol, but partial byte transfer is not automatically resumed; uncertain finalization uses the journal/reconciliation behavior above. Google indexing operations are polled for up to four minutes per invocation; rerun to continue pending operations.

## Section and chapter maintenance

```sh
python3 -B scripts/rag/index_book.py reindex-section --pdf /absolute/path/2106.11342v5.pdf --section 7.2 --dry-run
python3 -B scripts/rag/index_book.py reindex-section --pdf /absolute/path/2106.11342v5.pdf --section 7.2
python3 -B scripts/rag/index_book.py reindex-chapter --pdf /absolute/path/2106.11342v5.pdf --chapter chapter-7
python3 -B scripts/rag/index_book.py reindex-chapter --pdf /absolute/path/2106.11342v5.pdf --chapter appendix-a
```

Reindex is idempotent: unchanged matching active documents are retained. Changed sections upload first; only after replacement is active are older documents with that exact source hash, version, and section removed. A section command indexes its direct section, while chapter commands include descendants. Excluded/non-substantive section targets cannot produce documents. To select a nondefault manifest, add `--manifest /private/path/manifest.json`. Keep that location outside publication inputs. Store/source/version or chunking mismatches require a separate manifest/store, not silently reused state.

`verify` checks local source identity/extraction and the presence of active remote documents with matching section content digests. Remote names and source identities must belong to the selected private store. It does not send generation requests or claim Gemini latency/quality is healthy.

## Enable in the Worker

Only after verification, set these **Worker-only** values together, taking the store name from the private manifest:

- `GEMINI_FILE_SEARCH_STORE`: the exact `fileSearchStores/...` resource.
- `RAG_CONTENT_VERSION`: `d2l-companion-2026.11-v1`.
- `RAG_SOURCE_HASH`: `93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56`.

Use Cloudflare dashboard Worker variables/secrets or a private Wrangler configuration. Keep `GEMINI_API_KEY` and `TURNSTILE_SECRET` in Worker secrets. None of these use a `VITE_` prefix; `.env.example` contains comments only. Public browser configuration remains just the tutor URL and public Turnstile site key. Removing the store variable disables RAG and uses reviewed companion summaries. A missing/mismatched source hash or content version also selects that fallback. Configuration asserts the verified manifest identity; the Worker additionally pins both values in retrieval filters and validates returned citation metadata.

The provider uses `generateContent` with the File Search tool and structured JSON. It validates `candidates[].groundingMetadata.groundingChunks[].retrievedContext.customMetadata` and `groundingSupports[].groundingChunkIndices`, rejecting unknown sections, wrong source/version/chapter, duplicate metadata keys, invalid support indices, and citations unsupported by retrieved evidence. It ignores Google/model page numbers and uses reviewed server pages. No evidence returns a fixed insufficient-evidence response. It never trusts a model-authored page or client-provided filter. Transport-specific fields stay in the provider/adapter so a future Interactions migration need not affect callers.

The 20 studio contexts are a small, companion-authored server snapshot. Regenerate with `node scripts/rag/export_contexts.mjs`; tests compare every summary/concept/reference with the reviewed studio modules and source manifest. No extracted PDF text is involved.

## Timeouts and privacy

One Worker budget is 25 seconds, including request-body reading, verification, rate-limit/KV awaits, and generation. Turnstile has at most five seconds; each model retains at most ten seconds and is further limited by remaining Worker time. All transport deadlines include response-body consumption. Timed-out requests are aborted and owned readers canceled. Network/body failures and HTTP 5xx can fall back to the second model; malformed/truncated output, configuration failures, and quota failures retain distinct safe responses. KV cannot be canceled by its API, so a late write may consume allowance, but a timed-out limit check never permits generation.

The browser budget is 30 seconds through JSON parsing, leaving five seconds beyond the Worker budget for network delivery. These bounds repair the header-only deadline defect; they do not prove the live upstream latency problem is resolved. No prompt, answer, key, token, or key-bearing URL is logged. Existing rate quotas/counters are preserved.

Gemini processes indexed source documents and the submitted conversation fragments. Indexing embeddings and ordinary generation are separate quota/cost operations; retrieval also contributes generation input tokens. Keep billing configuration unchanged unless explicitly authorized. Google documents that raw File objects expire after 48 hours while File Search data persists until deletion. See [File Search lifecycle and pricing](https://aistudio.google.com/docs/file-search). This implementation has not been live-provisioned or quota-tested.

## Delete the private store

```sh
python3 -B scripts/rag/index_book.py delete-store --pdf /absolute/path/2106.11342v5.pdf --store fileSearchStores/EXACT_NAME --confirm fileSearchStores/EXACT_NAME --dry-run
python3 -B scripts/rag/index_book.py delete-store --pdf /absolute/path/2106.11342v5.pdf --store fileSearchStores/EXACT_NAME --confirm fileSearchStores/EXACT_NAME
```

The exact resource must be supplied twice; a shortened name is rejected. Live deletion uses `force=true` and removes the store's documents/chunks. Remove the Worker RAG variables afterward and archive/remove the private manifest. Resetting browser progress does **not** delete remote retrieval data.

## Offline checks and API references

```sh
npm test -- tests/worker/rag.test.ts tests/worker/tutor.test.ts tests/tutor/client.test.ts tests/rag/ingestion.test.js
python3 -B -m unittest discover -s tests/rag -p '*_test.py'
npm run typecheck
npm run build
WRANGLER_LOG_PATH=/tmp/d2l-wrangler.log npx wrangler deploy --dry-run --config worker/wrangler.jsonc --outdir /tmp/d2l-worker-dry-run
```

Tests use synthetic prose and fake transports only. The browser test suite covers lazy studio tutor availability and existing Turnstile behavior. No source PDF, extracted text, private store payload, manifest, or secret belongs in Git, `dist`, or Worker output.

Official transport references: [generateContent grounding metadata](https://aistudio.google.com/api-reference/generate-content), [File Search and structured output](https://aistudio.google.com/docs/file-search#structured-output), [store lifecycle API](https://aistudio.google.com/api-reference/file-search/file-search-stores), [document API](https://ai.google.dev/api/file-search/documents), and [metadata filter syntax](https://google.aip.dev/160).
