# Chunked SSR data resolution — implementation plan

Tracking: [#4458](https://github.com/scalar/scalar/issues/4458) (Vue/Nuxt SSR hydration error)

This is the design + phased plan for resolving the SSR hydration mismatches in the
API reference by loading and serializing the OpenAPI document on the server and
hydrating the client from that state, using the **server-side workspace store**
(`@scalar/workspace-store/server`) with chunked, lazily-fetched documents.

It is the destination architecture. The phases are ordered so each one is shippable
and verifiable on its own.

## Why this is needed

`packages/api-reference/src/components/ApiReference.ssr.test.ts` (regression guard
from #4458) renders the reference with `renderToString`, hydrates the same markup,
and fails on any Vue hydration mismatch. It is red today.

## Root cause (verified in code)

There are **two stacked mismatch layers**:

1. **The document is not on the client at hydration.**
   - Server: `onServerPrefetch(() => changeSelectedDocument(activeSlug))`
     (`ApiReference.vue:822`) is awaited by `renderToString`, so the document is
     loaded and the server renders full content.
   - Client: the document is loaded in `onBeforeMount(async () => …)`
     (`ApiReference.vue:825`). Vue does **not** await an async `onBeforeMount`
     before the first (hydration) render, so the client's first render shows the
     loading skeleton (`IntroductionLayout.vue`, `v-if="!info"`). → mismatch.

2. **Lazy rendering is SSR-inconsistent.**
   - `useLazyBus` returns
     `isReady = typeof window === 'undefined' || priorityQueue.has(id) || readyQueue.has(id)`
     (`helpers/lazy-bus.ts:236`). The server (no `window`) renders **every**
     operation in full; the client's first render shows **placeholders** (the
     queues only fill after `onMounted` via the IntersectionObserver). → mismatch.
   - Today this layer is hidden: layer 1 makes Vue bail on the `Content` subtree and
     client-render it, so the lazy operations are never compared. Fixing layer 1
     surfaces layer 2.

A clean fix has to make the client's **first render identical to the server's**,
which means the data the server rendered must be available **synchronously** on the
client at hydration time.

## Architecture: chunked SSR

The server-side store already produces exactly the shape we want:

- `createServerWorkspaceStore({ mode: 'ssr' | 'static', documents })`
  (`workspace-store/src/server.ts`) loads a document and returns a **sparse**
  workspace: `info`, `tags`, `servers`, and the pre-computed `x-scalar-navigation`
  tree are kept **inline**, while `components` and `paths` (operations) are
  **externalized** to `$ref` chunks (`${baseUrl}/<doc>/operations/...#` in `ssr`
  mode, `./chunks/...` in `static` mode). `store.get(pointer)` returns a chunk.

The hydration-clean flow this enables:

1. **Server** renders `info` + sidebar (both inline) and renders each operation as a
   **placeholder** (its data is an unresolved `$ref` chunk — it is *not* expanded
   inline). Above-the-fold operations may be pre-resolved and inlined as a priority
   set for SEO.
2. The sparse workspace (+ any inlined priority chunks) is **serialized into the
   HTML**.
3. **Client** loads that sparse workspace **synchronously before the first render**,
   so it renders the identical view (info + sidebar + operation placeholders). No
   mismatch.
4. After hydration, as operations scroll into view, the client **fetches their
   chunks** (`store.resolve([...])`) and renders them — strictly post-hydration, so
   no mismatch.

This keeps the initial HTML/payload small (the win over inlining the whole resolved
document) while still serving SEO-relevant content (title, description, the full
navigation with operation summaries and paths).

## Gaps found (what is NOT built yet)

Verified empirically, not assumed:

- **Transitive chunk resolution is incomplete.** Un-skipping
  `workspace-store/src/client.test.ts:489` ("correctly resolve chunks from the
  remote server"): single-level resolution works
  (`await store.resolve(['paths','/users','get'])` resolves the operation), but a
  `$ref` *inside* the fetched chunk (operation → component schema chunk) is left
  unresolved (`Cannot read properties of undefined (reading '$ref-value')`). Chunked
  rendering needs an operation and everything it references to resolve together.
- **Sparse `$ref` placeholders fail document validation.** The same run logs
  `Expected union value` for `/components/schemas/User` carrying
  `{ $ref: '…#', $global: true }` — the sparse shape needs to validate (or validation
  needs to tolerate unresolved chunk refs).
- **Lazy renders eagerly on the server** (`lazy-bus.ts:236`). For chunked SSR the
  server must render placeholders for unresolved operations, and the client must
  render the identical placeholders at hydration — a change to the Lazy / operation
  rendering path so it keys off "is this operation's chunk resolved" rather than
  "is `window` undefined / is it in the viewport".
- **`createServerWorkspaceStore` is Node-only** (`node:fs`,
  `@scalar/json-magic/bundle/plugins/node`). It cannot be imported into the browser
  bundle of `@scalar/api-reference`. The server-store usage must live in a
  server-only context (the `@scalar/server-side-rendering` package, the Nuxt module,
  or the host's server), and `ApiReference` must **accept a pre-built sparse
  workspace** via config rather than building it itself. The client reads the
  serialized payload.
- **No end-to-end server→client chunked consumer exists** in the repo today
  (no usage of `getWorkspace()` / `generateWorkspaceChunks` outside the store's own
  tests).

## Phased plan

Each phase is independently shippable and has its own verification.

### Phase 1 — Transitive chunk resolution (workspace-store)

Make a resolved chunk's own `$ref`s resolve too, and let the sparse shape validate.

- Fix `store.resolve()` / the bundler so resolving a chunk recursively resolves the
  external `$ref`s it contains (operation → schema → nested schema).
- Make the document schema accept unresolved chunk `$ref`s (or resolve-then-validate).
- **Verify:** un-skip and pass `client.test.ts:489`, plus a new test that a
  multi-level operation→schema→schema chunk graph fully resolves.

### Phase 2 — Client consumes a sparse workspace synchronously (workspace-store + api-reference)

- Add a way to load a server sparse workspace into the client store and render it
  with operations as unresolved placeholders, resolving chunks on demand.
- Decide the serialization contract (the sparse workspace + optional inlined priority
  chunks) embedded in the HTML.
- **Verify:** a unit test that builds a sparse workspace with the server store, loads
  it into the client store, and reads `info`/navigation synchronously while
  operations are still `$ref`s.

### Phase 3 — Lazy / operation rendering is hydration-consistent (api-reference)

- Render an operation as a placeholder when its chunk is unresolved, on both server
  and client; render content when resolved. Key the Lazy/placeholder decision off
  chunk-resolution state, not `typeof window` / viewport.
- Trigger `store.resolve()` when a placeholder scrolls into view (post-hydration).
- **Verify:** the hydration test for a `<Lazy>`-wrapped operation subtree hydrates
  clean.

### Phase 4 — `ApiReference` accepts injected SSR state + payload round-trip (api-reference)

- Add a config/prop for a pre-built sparse workspace (built server-side by the host).
- On the server, serialize it into the HTML (a `<script type="application/json">`).
- On the client, read it during setup and `loadWorkspace`/`importWorkspace`
  **before the first render**; skip the async `onBeforeMount` refetch.
- **Verify:** `ApiReference.ssr.test.ts` (the #4458 guard) goes **green**.

### Phase 5 — Wire through the SSR entry points

- `@scalar/server-side-rendering`: build the server store in `renderApiReference`,
  serialize the sparse workspace + priority chunks, serve remaining chunks (an
  endpoint in `ssr` mode, files in `static` mode), pass the state to the client
  bootstrap.
- `@scalar/nuxt`: same, via Nuxt's payload/`useState`.
- **Verify:** SSR/SSG e2e that loads the rendered page in a real browser and asserts
  zero console hydration warnings (the dev-mode Vite SSR harness used while
  investigating #4458 is a good basis).

## Open questions

- **Priority/above-the-fold chunk set:** which operations get inlined for SEO vs.
  left as lazy placeholders? Default to "none inlined" (smallest payload, sidebar +
  info for SEO) and make it configurable?
- **Payload size vs. requests:** inlining priority chunks reduces requests but grows
  HTML. Needs a sensible default.
- **`static` vs `ssr` mode:** SSG (vite-ssg, Nuxt `generate`) wants `static` (chunk
  files on disk); a live server wants `ssr` (a chunk endpoint). Both should be
  supported by Phase 5.

## Verification asset

The regression guard `packages/api-reference/src/components/ApiReference.ssr.test.ts`
(from #4458) is the green/red signal for Phases 1–4. The Phase 5 e2e is the signal
for real-browser hydration.
