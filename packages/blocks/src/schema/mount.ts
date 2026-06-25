import { ScalarTeleportRoot } from '@scalar/components/teleport'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { getValueByPointer } from '@scalar/workspace-store/helpers/get-value-by-pointer'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, createApp, h, reactive } from 'vue'

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
  /**
   * Whether the root schema is rendered expanded without a collapse toggle.
   *
   * Defaults to `true` so a standalone schema fills its container and shows its
   * properties, matching how the API reference embeds a lone schema. Pass
   * `false` to render it as a collapsible disclosure instead.
   */
  noncollapsible?: boolean
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
 * Mount the Schema block to a DOM element without Vue.
 *
 * Pass a `schema` directly, or a `store` plus a `pointer` to render a schema
 * from the active document of a workspace store.
 */
export const createSchema = (el: HTMLElement | string, options: CreateSchemaOptions) => {
  const element = typeof el === 'string' ? document.querySelector(el) : el
  if (!element) {
    throw new Error(`Element not found${typeof el === 'string' ? `: ${el}` : ''}`)
  }

  // The schema tree expects an event bus for anchor/copy interactions. The
  // standalone block creates its own private bus so those actions stay local.
  const eventBus = createWorkspaceEventBus()

  /** The active document, used to resolve the pointer and discriminator mappings. */
  const activeDocument = () => {
    const document = options.store?.workspace.activeDocument
    return document && 'paths' in document ? document : undefined
  }

  type SchemaContext = { schema: SchemaObject; document: ReturnType<typeof activeDocument> }

  /**
   * Resolve the schema together with the document it came from.
   *
   * The two are tracked as one unit so discriminator `mapping` references stay
   * consistent with the rendered schema: a mapping like `Cat` is resolved
   * against `document.components.schemas`, so the schema and that document have
   * to be the same one. Returns `undefined` when the pointer does not resolve.
   */
  const resolveContext = (): SchemaContext | undefined => {
    if (options.schema) {
      return { schema: options.schema, document: activeDocument() }
    }
    if (options.store && options.pointer) {
      const document = activeDocument()
      const schema = getValueByPointer(document, options.pointer) as SchemaObject | undefined
      return schema ? { schema, document } : undefined
    }
    return undefined
  }

  // Fail loudly when neither input resolves to a schema, mirroring the
  // "element not found" guard above.
  if (!resolveContext()) {
    throw new Error('No schema to render: pass `schema`, or `store` and a resolvable `pointer`.')
  }

  // Remember the last context that resolved so a transient miss (e.g. the active
  // document is swapped to one without this pointer after mount) keeps rendering
  // the previous schema, paired with the document it actually came from, instead
  // of flashing empty or resolving its discriminator mappings against the wrong
  // document. Mirrors createCodeExample's last-context fallback.
  let lastContext: SchemaContext | undefined

  /** Current schema + document, falling back to the last good resolution on a transient miss. */
  const currentContext = (): SchemaContext | undefined => {
    const context = resolveContext()
    if (context) {
      lastContext = context
    }
    return context ?? lastContext
  }

  /**
   * Display options forwarded to the schema tree.
   *
   * Memoized so the object identity only changes when the resolved context does.
   * The options are prop-drilled through every node in the tree, so a fresh
   * object on each read would invalidate that prop everywhere and force
   * needless re-renders. The schema's own document is defaulted in so
   * discriminator `mapping` references resolve, unless the caller supplied their
   * own.
   */
  const resolvedOptions = computed<SchemaOptions>(() => ({
    document: currentContext()?.document,
    ...options.options,
  }))

  // Props are getters so the block tracks the reactive store (active document)
  // live when rendering from a pointer.
  const props = reactive({
    get schema() {
      return currentContext()?.schema
    },
    get name() {
      return options.name
    },
    eventBus,
    // Render the standalone block expanded and full-width by default, like the
    // API reference does when it embeds a schema on its own (see AsyncApi
    // Message). Consumers can opt into a collapsible root via the option.
    noncollapsible: options.noncollapsible ?? true,
    get options(): SchemaOptions {
      return resolvedOptions.value
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
