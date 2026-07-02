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
