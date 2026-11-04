# Tutor Worker operations

The Worker serves reviewed companion context for all 32 learning entries. Its 20 studio contexts are companion-authored metadata, synchronized by `node scripts/rag/export_contexts.mjs` and checked by tests. It accepts allowlisted entry IDs, verifies Turnstile, and keeps the existing approximately five requests/minute, 25/client/day, and 250/global/day limits. It does not log prompt bodies or answers. Observability remains disabled in the committed configuration.

## Provision and deploy

Use Node 22 and installed project dependencies. Set `ALLOWED_ORIGIN` in `worker/wrangler.jsonc` to the Pages origin (`https://adrianamiu.github.io`, without its path). The configured `DAILY_LIMITS` KV namespace and `RATE_LIMITER` binding must belong to the target Cloudflare account; provision an equivalent namespace/binding for another account before deployment. Do not reset counters during a normal release.

Authenticate and set server-only secrets interactively:

```sh
npx wrangler login
npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.jsonc
npx wrangler secret put TURNSTILE_SECRET --config worker/wrangler.jsonc
npm run typecheck
npm test -- tests/worker tests/tutor
WRANGLER_LOG_PATH=/tmp/d2l-wrangler.log npx wrangler deploy --dry-run --config worker/wrangler.jsonc --outdir /tmp/d2l-worker-dry-run
python3 -B scripts/verify_release.py --worker-out /tmp/d2l-worker-dry-run
npx wrangler deploy --config worker/wrangler.jsonc --keep-vars
```

Never copy a key into a command argument, browser configuration, committed file, or build log. `.github/workflows/worker.yml` preserves the repository secret names `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; without both, CI validates but skips deploy. Runtime `GEMINI_API_KEY` and `TURNSTILE_SECRET` are configured in Cloudflare, not required by CI. Pages receives only `VITE_TUTOR_URL` and `VITE_TURNSTILE_SITE_KEY` through its existing repository secrets.

## Optional book grounding

The committed `vars` deliberately omit retrieval. With no store, the Worker uses reviewed companion explanations. A partial or wrong source/version assertion also selects that fallback at runtime. The build needs no retrieval settings or credentials; the release audit rejects a partially configured committed RAG tuple.

Before enabling retrieval, follow [private retrieval administration](../scripts/rag/README.md) to dry-run, create/resume, and **verify** the store against the pinned PDF. Provisioning sends book documents to Google and has not been executed during implementation. The free-tier data-use disclosure applies to indexing as well as submitted tutor context. Review that disclosure and quota/billing settings before upload.

After remote verification succeeds, set these values together in Cloudflare Worker settings (or a private Wrangler configuration):

| Worker-only value | Required value |
| --- | --- |
| `GEMINI_FILE_SEARCH_STORE` | Exact `fileSearchStores/...` resource from the private manifest |
| `RAG_CONTENT_VERSION` | `d2l-companion-2026.11-v1` |
| `RAG_SOURCE_HASH` | `93316e525a034cfa935023c3c31196c86f5edfd0e056f50f09676f6364a0be56` |

Keep them out of `VITE_` variables, Pages artifacts, and public logs. Dashboard/private settings must be retained deliberately during Wrangler deployments (use `--keep-vars` when preserving dashboard variables). The CI deployment uses `--keep-vars` so an existing verified store configuration survives a code release. Neither that option nor CI verifies remote coverage. Never enable a store merely because the bundle compiles.

The private administration guide documents `verify`, `reindex-section`, `reindex-chapter`, uncertain upload recovery, and exact-name double confirmation for `delete-store`. Before deleting, disable retrieval by removing its three Worker variables, then follow that guide; archive/remove the private manifest afterward. Browser reset does not delete the remote store. Keep the manifest private and do not index in CI.

A valid book response must carry server-validated grounding references. Missing retrieval evidence produces an insufficient-evidence response; unsupported/malformed citations are rejected. Companion fallback is labelled separately in the browser. Offline tests cannot establish live latency or quota health.

## Rollback and verification

Record the successful Worker deployment/version identifier in the private release record. For an incident, use Cloudflare's Worker deployment history to roll back to the last known-good version. Inspect that version's bindings and variables first: code rollback does not prove the same store/source/content-version configuration is still appropriate. Remove the retrieval tuple to restore companion mode if its verified identity is uncertain. Preserve the existing KV namespace, rate-limit bindings, and secrets; do not clear learning data or remote stores as a rollback step.

Alternatively, restore a reviewed known-good source revision through the repository revert/PR flow and rerun the Worker workflow. After release, confirm allowed-origin handling, fresh Turnstile verification, companion behavior without RAG, and (only with a verified configured store) book citations. Use a consented non-sensitive prompt for live smoke tests and respect existing quotas. No live smoke or remote verification was performed by the implementation agent.
