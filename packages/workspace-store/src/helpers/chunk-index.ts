import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { isObject } from '@scalar/helpers/object/is-object'
import { escapeJsonPointer } from '@scalar/json-magic/helpers/escape-json-pointer'

import { encodeChunkName } from '@/helpers/encode-chunk-name'

/**
 * The extension key a compact sparse document carries its chunk index under.
 *
 * It exists on the wire only: the client expands the index back into per-node references while the
 * document is ingested and removes the key, so nothing downstream ever sees it.
 */
export const CHUNK_INDEX_KEY = 'x-scalar-chunk-index'

/** Stands in for an externalized operation on a compact path item. */
const OPERATION_PLACEHOLDER = 0

/** Where a document's chunks live, which decides how each reference to one is spelled. */
export type ChunkMode = 'static' | 'ssr'

/** The `$ref` template for each kind of chunk, with `{…}` slots the reader fills in. */
export type ChunkRefTemplates = {
  /** Slots: `{type}`, `{name}`. */
  components: string
  /** Slots: `{path}`, `{method}`. */
  operations: string
  /** No slots. */
  navigation: string
}

/**
 * The compact stand-in for a sparse document's `components` and `paths`.
 *
 * Every reference the non-compact form spells out node by node is derivable from where that node
 * sits, so the index carries the positions and one template per kind instead. What a path item
 * keeps besides its operations is not derivable, so it rides along verbatim.
 */
export type ChunkIndex = {
  mode: ChunkMode
  refs: ChunkRefTemplates
  /** Component names per component type, in document order. */
  components: Record<string, string[]>
  /**
   * Each path item with its operations replaced by a placeholder.
   *
   * The whole path item is kept rather than a list of methods so that both its key order and the
   * keys that were never externalized survive: `parameters`, `summary`, `servers` and extensions
   * all stay inline in the non-compact form.
   */
  paths: Record<string, Record<string, unknown>>
}

/** Matches a `{slot}` in a template, or a doubled brace standing for a literal one. */
const TEMPLATE_SLOT = /\{\{|\}\}|\{(\w+)\}/g

/**
 * Fills the `{slot}`s of a chunk-reference template.
 *
 * `{{` and `}}` stand for literal braces, so text the writer inlined into a template — a document
 * name, a base URL — may contain braces without being read back as a slot. An unknown slot is left
 * alone rather than blanked, so a template from a newer writer fails visibly instead of resolving
 * to the wrong chunk.
 */
export const fillChunkRef = (template: string, values: Record<string, string> = {}): string =>
  template.replace(TEMPLATE_SLOT, (match: string, slot: string | undefined) =>
    slot === undefined ? match.charAt(0) : (values[slot] ?? match),
  )

/** Escapes text inlined into a template verbatim, so its braces are not read back as slots. */
const escapeTemplateLiteral = (text: string): string => text.replaceAll('{', '{{').replaceAll('}', '}}')

const identity = (value: string): string => value

/**
 * How each template slot is spelled, per mode.
 *
 * Static references name files, so their variable segments go through `encodeChunkName` — the same
 * call `generateWorkspaceChunks` makes when it writes those files. SSR references name pointers
 * into the store's in-memory assets, which `get()` looks up with JSON Pointer segments, so only the
 * path is escaped. A method is never encoded in either mode: it is written as it was read, and
 * `isHttpMethod` keeps it to letters.
 *
 * Both sides read the table from here. A reader that encoded a segment differently would build a
 * reference to a chunk that does not exist.
 */
const SLOT_ENCODERS: Record<ChunkMode, Record<'type' | 'name' | 'path' | 'method', (value: string) => string>> = {
  static: { type: encodeChunkName, name: encodeChunkName, path: encodeChunkName, method: identity },
  ssr: { type: identity, name: identity, path: escapeJsonPointer, method: identity },
}

/**
 * Builds the reference templates for one document.
 *
 * Filled, these produce exactly the references `externalizeComponentReferences` and
 * `externalizePathReferences` write, so a client that expands the index lands on the same chunk.
 */
export const chunkRefTemplates = (
  meta: { mode: 'ssr'; name: string; baseUrl: string } | { mode: 'static'; name: string },
): ChunkRefTemplates => {
  if (meta.mode === 'ssr') {
    const base = `${escapeTemplateLiteral(meta.baseUrl)}/${escapeTemplateLiteral(meta.name)}`

    return {
      components: `${base}/components/{type}/{name}#`,
      operations: `${base}/operations/{path}/{method}#`,
      navigation: `${base}/navigation#`,
    }
  }

  const base = `./chunks/${escapeTemplateLiteral(encodeChunkName(meta.name))}`

  return {
    components: `${base}/components/{type}/{name}.json#`,
    operations: `${base}/operations/{path}/{method}.json#`,
    navigation: `${base}/navigation.json#`,
  }
}

/** The reference a lazily loaded chunk is reached through. */
export const chunkReference = (ref: string): { $ref: string; $global: true } => ({ '$ref': ref, $global: true })

/**
 * Compacts a sparse document's `components` and `paths` into an index.
 *
 * Takes the sections the externalizers produced rather than the document itself, so the index is
 * built from the very references it replaces and the two cannot come to describe different sets of
 * chunks.
 */
export const buildChunkIndex = ({
  mode,
  refs,
  components,
  paths,
}: {
  mode: ChunkMode
  refs: ChunkRefTemplates
  components: Record<string, Record<string, unknown>>
  paths: Record<string, Record<string, unknown>>
}): ChunkIndex => ({
  mode,
  refs,
  components: Object.fromEntries(Object.entries(components).map(([type, names]) => [type, Object.keys(names)])),
  paths: Object.fromEntries(
    Object.entries(paths).map(([path, pathItem]) => [
      path,
      Object.fromEntries(
        Object.entries(pathItem).map(([key, value]) => [key, isHttpMethod(key) ? OPERATION_PLACEHOLDER : value]),
      ),
    ]),
  ),
})

/** Whether a value is shaped like an index this build knows how to expand. */
const isChunkIndex = (value: unknown): value is ChunkIndex =>
  isObject(value) &&
  (value['mode'] === 'static' || value['mode'] === 'ssr') &&
  isObject(value['refs']) &&
  isObject(value['components']) &&
  isObject(value['paths'])

/**
 * Expands a compact sparse document into the one a non-compact server store would have sent.
 *
 * Mutates the document in place and drops the index key, so what the rest of the store sees is an
 * ordinary sparse document: `resolve()`, the bundler and anything enumerating `paths` or
 * `components` are looking at the shape they always have.
 *
 * A document without an index is left alone, which is every document a non-compact server store or
 * an author produces.
 *
 * @param document - The document to expand, mutated in place
 * @returns Whether an index was found and expanded
 */
export const expandChunkIndex = (document: unknown): boolean => {
  if (!isObject(document) || document[CHUNK_INDEX_KEY] === undefined) {
    return false
  }

  const index = document[CHUNK_INDEX_KEY]

  if (!isChunkIndex(index)) {
    // The key is dropped rather than passed on: it is not part of any document a consumer should
    // see, and the sections it stands for are missing either way, so there is nothing a partial
    // expansion could recover.
    delete document[CHUNK_INDEX_KEY]
    console.warn(`Ignoring an unreadable "${CHUNK_INDEX_KEY}"; this document's chunks cannot be resolved.`)
    return false
  }

  const encoders = SLOT_ENCODERS[index.mode]

  // Define own properties so document keys such as `__proto__` remain data, without invoking
  // inherited setters or changing the prototype of any expanded object.
  const components = Object.fromEntries(
    Object.entries(index.components).map(([type, names]) => [
      type,
      Object.fromEntries(
        names.map((name) => [
          name,
          chunkReference(fillChunkRef(index.refs.components, { type: encoders.type(type), name: encoders.name(name) })),
        ]),
      ),
    ]),
  )

  const paths = Object.fromEntries(
    Object.entries(index.paths).map(([path, pathItem]) => [
      path,
      Object.fromEntries(
        Object.entries(pathItem).map(([key, value]) => [
          key,
          isHttpMethod(key)
            ? chunkReference(
                fillChunkRef(index.refs.operations, { path: encoders.path(path), method: encoders.method(key) }),
              )
            : value,
        ]),
      ),
    ]),
  )

  document['components'] = components
  document['paths'] = paths
  delete document[CHUNK_INDEX_KEY]

  return true
}
