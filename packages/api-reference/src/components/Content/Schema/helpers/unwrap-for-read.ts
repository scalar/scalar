import { unpackDetectChangesProxy } from '@scalar/workspace-store/helpers/detect-changes-proxy'
import { toRaw } from 'vue'

/**
 * Peel the two write-oriented layers off a workspace value so the schema tree reads it
 * through the magic and overrides proxies only.
 *
 * In the app a document sits under four proxies: Vue's `reactive` wraps a detect-changes
 * proxy (see `createWorkspaceStore`), which wraps `createOverridesProxy(createMagicProxy(raw))`.
 * Rendering a schema is read-only, but every property access still pays for all four: the
 * reactive layer tracks a dependency and lazily wraps the child, and the detect-changes `get`
 * allocates a fresh `{ ...args, path: [...args.path, prop] }` for every object-valued read.
 * Together they make a nested read roughly sixteen times more expensive than the same read
 * through the magic layer alone.
 *
 * Only the outer two layers are removed. The magic layer must stay, because every resolver in
 * this directory reads the virtual `$ref-value` property it synthesises, and the overrides
 * layer must stay so `x-scalar-*` overrides keep resolving. That rules out the store's own
 * `getRaw` / `unpackProxyObject` helpers (they strip the magic layer, and `unpackProxyObject`
 * writes unpacked children back onto the raw document) as well as `markRaw` (it would write
 * `__v_skip` through the detect-changes set hooks).
 *
 * What this gives up is Vue dependency tracking on reads *inside* a schema subtree. That is
 * safe here because the API reference never mutates a schema node in place: documents are
 * added or replaced whole and switched by name, so a `Schema` root always receives a new
 * object and re-renders from the prop identity, and the in-place writes that do exist
 * (`x-scalar-active-document`, `x-scalar-is-dirty`) are document-level keys no schema
 * component reads.
 *
 * That invariant is the precondition, so here is what would break it. Anything that fills an
 * existing schema node in place, rather than handing the tree a new object, becomes invisible
 * to every component below a `Schema` root and the stale subtree stays on screen:
 *
 * - `store.resolve(path)` in `@scalar/workspace-store` (see `client.ts`) bundles lazily and
 *   populates the node already at `path`. The API reference does not call it today. Wiring up
 *   lazy `$ref` bundling means this unwrap has to go, or the resolved subtree has to arrive as
 *   a new object the `Schema` prop can be swapped to.
 * - `merge-all-of-schemas.ts` reaches one in-place write of its own: when a merged `items` was
 *   itself taken from the document (`result.items = items`), a later pass `Object.assign`s onto
 *   that document node. It is idempotent and runs while the same render is still computing, so
 *   nothing re-reads it afterwards, but it is the shape to watch for.
 *
 * There is deliberately no runtime guard. Catching these writes would mean proxying the whole
 * subtree again — the exact per-read cost this removes — and the writes above happen on nodes
 * reached through `resolve.schema`, not through the value returned here, so a shallow proxy on
 * the root would catch none of them.
 *
 * Idempotent: a plain object (unit tests, stories, static documents) is returned unchanged.
 */
export const unwrapForRead = <T>(value: T): T => unpackDetectChangesProxy(toRaw(value))
