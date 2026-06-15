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

const lifecycleHooksSchema = z.object({
  /** Called when the API Reference is initialized */
  onInit: z
    .function({
      input: [z.object({ config: baseConfigurationSchema.partial() })],
    })
    .optional(),
  /** Called when the API Reference configuration changes */
  onConfigChange: z
    .function({
      input: [z.object({ config: baseConfigurationSchema.partial() })],
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
