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
 * Idempotent: a plain object (unit tests, stories, static documents) is returned unchanged.
 */
export const unwrapForRead = <T>(value: T): T => unpackDetectChangesProxy(toRaw(value))
