import { parse as parseYaml } from '@amritk/yaml'

/** A single external-ref resolution failure (a missing file, a refused host, …). */
export type BundleError = {
  message: string
  path: (string | number)[]
}

/** Options governing how external `$ref`s are located and loaded. */
export type BundleOptions = {
  /** Absolute location the root document came from. Required to resolve relative external refs. */
  baseLocation?: string
  /** Whether http(s) external `$ref`s may be fetched. Defaults to `true`. */
  remote?: boolean
  /** If set, only these hosts may be fetched for remote `$ref`s. */
  allowedHosts?: string[]
  /** Allow remote `$ref`s to private/loopback hosts. Defaults to `false`. */
  allowPrivateHosts?: boolean
}

/** The bundled document plus any non-fatal errors encountered while loading externals. */
export type BundleResult = {
  document: unknown
  errors: BundleError[]
}

/** Splits a `$ref` into its document part (file/URL) and its in-document JSON pointer. */
const splitRef = (ref: string): { filePart: string; pointer: string } => {
  const hashIndex = ref.indexOf('#')
  return {
    filePart: hashIndex === -1 ? ref : ref.slice(0, hashIndex),
    pointer: hashIndex === -1 ? '' : ref.slice(hashIndex + 1),
  }
}

const isRemote = (location: string): boolean => /^https?:\/\//i.test(location)

/**
 * Resolves the location of an external `$ref` relative to the document it lives
 * in. We deliberately use `URL` (rather than `node:path`) so this stays free of
 * Node builtins and can run anywhere; local file paths are resolved through a
 * `file://` base so `../` segments collapse correctly cross-platform.
 */
const joinLocation = (base: string, ref: string): string => {
  if (isRemote(ref)) return ref
  if (isRemote(base)) return new URL(ref, base).href

  const directory = base.slice(0, base.lastIndexOf('/') + 1) || './'
  return decodeURIComponent(new URL(ref, `file://${directory}`).pathname)
}

/** Reports whether a document contains any external (non-`#/...`) `$ref`. */
const hasExternalRef = (node: unknown): boolean => {
  if (node === null || typeof node !== 'object') return false
  if (Array.isArray(node)) return node.some(hasExternalRef)

  const object = node as Record<string, unknown>
  if (typeof object['$ref'] === 'string') {
    // A `$ref` object's siblings are ignored on resolution, so we do not recurse into them.
    return splitRef(object['$ref']).filePart !== ''
  }

  return Object.values(object).some(hasExternalRef)
}

/**
 * A YAML-aware parser for external documents. `@amritk/resolve-refs` defaults to
 * `JSON.parse`, so we hand it this to support `.yaml`/`.yml` files without
 * teaching that package about YAML.
 */
const parseExternal = (content: string, location: string): unknown =>
  /\.ya?ml$/i.test(location) ? parseYaml(content) : JSON.parse(content)

/**
 * Bundles **external** (cross-file / remote) `$ref`s into the document while
 * leaving **internal** (`#/...`) refs untouched. This is the heart of the lazy-ref
 * design: internal refs stay as `$ref` nodes so the document graph remains
 * compact and cycle-safe, and `getResolvedRef` follows them on demand. Only
 * content that lives in another file/URL is pulled in, because an internal ref
 * into a document we are not bundling would otherwise dangle.
 *
 * The common case — a self-contained document with only internal refs — takes a
 * fast path that returns the input untouched and never loads the Node-only
 * resolver, keeping it out of client bundles.
 */
export const bundleExternalRefs = async (document: unknown, options: BundleOptions = {}): Promise<BundleResult> => {
  const errors: BundleError[] = []

  // Fast path: nothing external to bundle, so hand the document straight back.
  if (!hasExternalRef(document)) return { document, errors }

  // External bundling reads files and fetches URLs, which only works on the
  // server. Loading the resolver dynamically (and behind this guard) keeps
  // `@amritk/resolve-refs` and its `node:fs`/`node:path` imports out of the
  // client bundle's static graph.
  if (typeof window !== 'undefined') {
    errors.push({ message: 'External $ref bundling is only supported on the server.', path: [] })
    return { document, errors }
  }

  const { getByPointer, resolveRefsFromFile } = await import('@amritk/resolve-refs')

  // Each distinct external document is loaded — and fully self-resolved — once.
  // `resolveRefsFromFile` inlines that external document's own internal and
  // cross-file refs, so the node we graft in is already free of `$ref`s.
  const externalCache = new Map<string, unknown>()
  const loadExternal = async (location: string): Promise<unknown> => {
    const cached = externalCache.get(location)
    if (cached !== undefined) return cached

    const resolveOptions = {
      parse: parseExternal,
      ...(options.remote !== undefined && { remote: options.remote }),
      ...(options.allowedHosts !== undefined && { allowedHosts: options.allowedHosts }),
      ...(options.allowPrivateHosts !== undefined && { allowPrivateHosts: options.allowPrivateHosts }),
    }

    const result = await resolveRefsFromFile(location, resolveOptions)
    errors.push(...result.errors)
    externalCache.set(location, result.resolved)
    return result.resolved
  }

  const walk = async (node: unknown, baseLocation: string | undefined): Promise<unknown> => {
    if (node === null || typeof node !== 'object') return node
    if (Array.isArray(node)) return Promise.all(node.map((item) => walk(item, baseLocation)))

    const object = node as Record<string, unknown>

    if (typeof object['$ref'] === 'string') {
      const ref = object['$ref']
      const { filePart, pointer } = splitRef(ref)

      // Internal ref: keep the node exactly as-is for lazy resolution later.
      if (filePart === '') return node

      if (!baseLocation) {
        errors.push({
          message: `Cannot resolve external $ref without a base location: ${ref}`,
          path: [],
        })
        return node
      }

      const targetLocation = joinLocation(baseLocation, filePart)
      const externalDocument = await loadExternal(targetLocation)
      const target = pointer ? getByPointer(externalDocument, pointer) : externalDocument

      if (target === undefined) {
        errors.push({ message: `External $ref target not found: ${ref}`, path: [] })
        return node
      }

      // Layer any sibling keys (e.g. `description`) over the inlined target,
      // matching OpenAPI 3.1 semantics where siblings win.
      const { $ref: _ref, ...siblings } = object
      return typeof target === 'object' && target !== null && !Array.isArray(target) && Object.keys(siblings).length > 0
        ? { ...target, ...siblings }
        : target
    }

    const result: Record<string, unknown> = {}
    for (const key of Object.keys(object)) {
      result[key] = await walk(object[key], baseLocation)
    }
    return result
  }

  const bundled = await walk(document, options.baseLocation)
  return { document: bundled, errors }
}
