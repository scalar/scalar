import { ScalarTeleportRoot } from '@scalar/components/teleport'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { createApp, h, reactive } from 'vue'

import Schema from './Schema.vue'
import type { SchemaOptions } from './types'

export type CreateSchemaOptions = {
  /**
   * A schema object to render directly.
   *
   * Use this when you already hold a schema. Either `schema` or `store` +
   * `pointer` must be provided; `schema` wins when both are present.
   */
  schema?: SchemaObject
  /**
   * Workspace store to resolve `pointer` against.
   *
   * When provided, the schema is read live from the store's active document, so
   * the block re-renders as the document changes, and discriminator `mapping`
   * references resolve against the same document.
   */
  store?: WorkspaceStore
  /**
   * JSON pointer to the schema within the active document, for example
   * `#/components/schemas/User`. Resolved against `store`.
   */
  pointer?: string
  /** Optional heading shown above the schema. */
  name?: string
  /** Display options forwarded to the schema tree. */
  options?: SchemaOptions
  /**
   * Force a color mode on the rendered block.
   *
   * When omitted, the block inherits the ambient theme of the host page. Pass
   * `true` for dark mode or `false` for light mode.
   */
  darkMode?: boolean
}

/**
 * Builds the wrapper classes for the mounted block.
 *
 * The `.scalar-app` class scopes the Tailwind utilities, and the optional
 * color-mode class lets consumers pin the block to dark or light.
 */
const getWrapperClass = (darkMode: boolean | undefined): string =>
  ['scalar-app', darkMode === true ? 'dark-mode' : darkMode === false ? 'light-mode' : ''].filter(Boolean).join(' ')

/**
 * Resolves a JSON pointer (e.g. `#/components/schemas/User`) against a document.
 *
 * Walks the document one segment at a time, resolving any `$ref` encountered
 * along the way so intermediate references do not break the lookup.
 */
const resolvePointer = (document: unknown, pointer: string): SchemaObject | undefined => {
  const segments = pointer
    .replace(/^#?\//, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))

  let current: unknown = document
  for (const segment of segments) {
    current = getResolvedRef(current)
    if (!current || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }

  return getResolvedRef(current) as SchemaObject | undefined
}

/**
 * Mount the Schema block to a DOM element without Vue.
 *
 * Pass a `schema` directly, or a `store` plus a `pointer` to render a schema
 * from the active document of a workspace store.
 */
export const createSchema = (el: HTMLElement | string, options: CreateSchemaOptions) => {
  const element = typeof el === 'string' ? document.querySelector(el) : el
  if (!element) {
    throw new Error(`Element not found: ${el}`)
  }

  // The schema tree expects an event bus for anchor/copy interactions. The
  // standalone block creates its own private bus so those actions stay local.
  const eventBus = createWorkspaceEventBus()

  /** The active document, used to resolve the pointer and discriminator mappings. */
  const activeDocument = () => {
    const document = options.store?.workspace.activeDocument
    return document && 'paths' in document ? document : undefined
  }

  /** Current schema, resolved live from the store when a pointer is used. */
  const currentSchema = (): SchemaObject | undefined => {
    if (options.schema) {
      return options.schema
    }
    if (options.store && options.pointer) {
      return resolvePointer(activeDocument(), options.pointer)
    }
    return undefined
  }

  // Fail loudly when neither input resolves to a schema, mirroring the
  // "element not found" guard above.
  if (!currentSchema()) {
    throw new Error('No schema to render: pass `schema`, or `store` and a resolvable `pointer`.')
  }

  // Props are getters so the block tracks the reactive store (active document)
  // live when rendering from a pointer.
  const props = reactive({
    get schema() {
      return currentSchema()
    },
    get name() {
      return options.name
    },
    eventBus,
    // Render the standalone block expanded and full-width, like the API
    // reference does when it embeds a schema on its own (see AsyncApi Message).
    noncollapsible: true,
    get options(): SchemaOptions {
      // Default the document to the active one so discriminator `mapping`
      // references resolve, unless the caller supplied their own.
      return { document: activeDocument(), ...options.options }
    },
  })

  // Wrap the block in its own teleport root so floating UI renders inside the
  // themed `.scalar-app` wrapper instead of escaping to `body`, where it would
  // miss the color-mode variables and lose its styling.
  const app = createApp(() =>
    h('div', { class: getWrapperClass(options.darkMode) }, [
      h(ScalarTeleportRoot, null, { default: () => h(Schema, props) }),
    ]),
  )

  app.mount(element)

  return {
    app,
    destroy: () => app.unmount(),
  }
}
