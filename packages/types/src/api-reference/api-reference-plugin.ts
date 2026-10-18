import type { MarkdownRenderHook } from '@scalar/helpers/markdown/markdown-render-hook'
import { z } from 'zod'

import { baseConfigurationSchema } from './base-configuration'

const openApiExtensionSchema = z.object({
  /**
   * Name of specification extension property. Has to start with `x-`.
   *
   * @example
   * ```yaml
   * x-custom-extension: foobar
   * ```
   */
  name: z.string().regex(/^x-/),
  /**
   * Vue component to render the specification extension
   */
  component: z.unknown(),
  /**
   * Custom renderer to render the specification extension
   */
  renderer: z.unknown().optional(),
})

const viewComponentSchema = z.object({
  /**
   * Vue component to render in the view
   */
  component: z.unknown(),
  /**
   * Custom renderer to render the view component (e.g., ReactRenderer)
   */
  renderer: z.unknown().optional(),
  /**
   * Additional props to pass to the component
   */
  props: z.record(z.string(), z.any()).optional(),
  /**
   * Sidebar configuration for this view component.
   * If provided with `show: true`, an entry will be shown in the sidebar.
   * Set `show: false` or omit to hide from the sidebar.
   */
  sidebar: z
    .object({
      /** Whether to show in sidebar */
      show: z.boolean().default(false),
      /** Label to display in the sidebar */
      label: z.string(),
    })
    .optional(),
})

/** A sidebar entry contributed by a plugin document type. */
export type PluginNavigationEntry = {
  /** Unique across the workspace: prefix it with the `documentId` passed to `traverse`. */
  id: string
  title: string
  /** Free-form discriminator owned by the document type, e.g. `workflow` or `step`. */
  kind?: string
  children?: PluginNavigationEntry[]
}

/**
 * A document format that API Reference does not support natively (it supports OpenAPI and AsyncAPI).
 *
 * The plugin detects documents of its format, optionally normalizes them, builds their sidebar entries,
 * and renders the whole document. Everything else (loading, the document selector, routing, the sidebar
 * and scroll tracking) is handled by API Reference.
 */
const documentTypeSchema = z.object({
  /** Stable identifier, stored on every claimed document as `x-scalar-document-type`. */
  type: z.string(),
  /** Human-readable name of the format, e.g. `Arazzo`. */
  label: z.string(),
  /** Whether this type handles the raw (parsed) document. Checked before OpenAPI and AsyncAPI. */
  detect: z.custom<(document: Record<string, unknown>) => boolean>(),
  /** Optional hook to upgrade, validate or normalize the document before it is stored. */
  ingest: z
    .custom<
      (
        document: Record<string, unknown>,
        context: { documentName: string },
      ) => Record<string, unknown> | Promise<Record<string, unknown>>
    >()
    .optional(),
  /** Resolve `$ref`s with the configured fetch before storing the document. Defaults to `false`. */
  bundle: z.boolean().optional(),
  /** Build the sidebar entries for the document. */
  traverse:
    z.custom<
      (context: {
        documentName: string
        documentId: string
        document: Record<string, unknown>
      }) => PluginNavigationEntry[]
    >(),
  /**
   * Renders the document in place of the built-in content.
   *
   * The component receives `document`, `documentName`, `documents` (every document in the workspace,
   * read-only), `navigation` (its sidebar entries), `eventBus` and `options`. Each rendered entry should
   * use the entry `id` as its element id, so sidebar navigation and deep links can scroll to it.
   */
  content: z.object({
    /** Vue component that renders the document */
    component: z.unknown(),
    /** Custom renderer to render the component (e.g., a renderer that mounts its own app) */
    renderer: z.unknown().optional(),
    /** Additional props to pass to the component */
    props: z.record(z.string(), z.any()).optional(),
  }),
})

const viewsSchema = z.object({
  /**
   * Renders before the Introduction/Info section
   */
  'content.start': z.array(viewComponentSchema).optional(),
  /**
   * Renders after the Models section
   */
  'content.end': z.array(viewComponentSchema).optional(),
})

/**
 * Read-only view of the stored secrets for a single security scheme.
 *
 * The concrete shape depends on the scheme `type` (`apiKey`, `http`, `oauth2`, `openIdConnect`),
 * so only `type` is guaranteed. The remaining fields (tokens, credentials, per-flow secrets) are
 * exposed loosely to avoid coupling the plugin API to the workspace store's internal schema.
 */
export type PluginAuthSecrets = { type: string } & Record<string, unknown>

/** Read-only view of the selected security for a document or operation. */
export type PluginSelectedSecurity = {
  /** Index of the currently selected security requirement. */
  selectedIndex: number
  /** The selected security requirements, each mapping a scheme name to its selected scopes. */
  selectedSchemes: Array<Record<string, string[]>>
}

/** Read-only view of the entire authentication state, keyed by document name. */
export type PluginDocumentAuth = Record<
  string,
  {
    /** Stored secrets keyed by security scheme name. */
    secrets: Record<string, PluginAuthSecrets>
    /** Selected security schemes at the document and operation level. */
    selected: {
      document?: PluginSelectedSecurity
      path?: Record<string, Record<string, PluginSelectedSecurity | undefined>>
    }
  }
>

/**
 * Read-only accessor for the global authentication state.
 *
 * Passed to plugin lifecycle hooks (`onInit`, `onConfigChange`) and exposed via the plugin
 * manager (`getAuthState`) so plugins can read stored secrets and selected security schemes
 * without being able to mutate them.
 */
export type PluginAuthState = {
  /** Returns a plain snapshot of the entire authentication state, keyed by document name. */
  export: () => PluginDocumentAuth
  /** Returns the stored secrets for a security scheme within a document, or `undefined` if none. */
  getAuthSecrets: (documentName: string, schemeName: string) => PluginAuthSecrets | undefined
  /** Returns the selected security for a document or operation, or `undefined` if none. */
  getAuthSelectedSchemas: (
    payload:
      | { type: 'document'; documentName: string }
      | { type: 'operation'; documentName: string; path: string; method: string },
  ) => PluginSelectedSecurity | undefined
}

/** Read-only accessor for the global authentication state, passed to lifecycle hooks. */
const pluginAuthStateSchema = z.custom<PluginAuthState>()

const lifecycleHooksSchema = z.object({
  /** Called when the API Reference is initialized */
  onInit: z
    .function({
      input: [z.object({ config: baseConfigurationSchema.partial(), auth: pluginAuthStateSchema })],
    })
    .optional(),
  /** Called when the API Reference configuration changes */
  onConfigChange: z
    .function({
      input: [z.object({ config: baseConfigurationSchema.partial(), auth: pluginAuthStateSchema })],
    })
    .optional(),
  /** Called when the API Reference is destroyed */
  onDestroy: z.function({ input: [] }).optional(),
})

export const apiReferencePluginSchema = z.function({
  input: [],
  output: z.object({
    name: z.string(),
    extensions: z.array(openApiExtensionSchema),
    /**
     * Components to render at specific views in the API Reference
     */
    views: viewsSchema.optional(),
    /**
     * Document formats this plugin teaches API Reference to load and render
     */
    documentTypes: z.array(documentTypeSchema).optional(),
    /** Browser-only enhancements for every Markdown rendering, including summaries and the client modal. */
    markdown: z.custom<MarkdownRenderHook>().optional(),
    /**
     * Lifecycle hooks for the plugin
     */
    hooks: lifecycleHooksSchema.optional(),
    /**
     * Client plugins to pass to the embedded API client.
     * Use this to extend the API client from an API reference plugin.
     */
    apiClientPlugins: z.array(z.any()).optional(),
  }),
})

// Infer the types from the schemas
export type SpecificationExtension = z.infer<typeof openApiExtensionSchema>
export type ViewComponent = z.infer<typeof viewComponentSchema>
export type LifecycleHooks = z.infer<typeof lifecycleHooksSchema>
export type ApiReferencePlugin = z.infer<typeof apiReferencePluginSchema>
