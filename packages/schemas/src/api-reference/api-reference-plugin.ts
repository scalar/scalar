import { type Static, any, array, fn, object, optional, record, string, unknown } from '@scalar/validation'

const openApiExtensionSchema = object({
  name: string({
    typeComment: 'Name of specification extension property. Has to start with \`x-\`.',
  }),
  component: unknown({
    typeComment: 'Vue component to render the specification extension',
  }),
  renderer: optional(
    unknown({
      typeComment: 'Custom renderer to render the specification extension',
    }),
  ),
})

const viewComponentSchema = object({
  component: unknown({
    typeComment: 'Vue component to render in the view',
  }),
  renderer: optional(
    unknown({
      typeComment: 'Custom renderer to render the view component (e.g., ReactRenderer)',
    }),
  ),
  props: optional(record(string(), any()), {
    typeComment: 'Additional props to pass to the component',
  }),
})

const viewsSchema = object({
  'content.end': optional(array(viewComponentSchema), {
    typeComment: 'Components to render at specific views in the API Reference',
  }),
})

const lifecycleHooksSchema = object({
  onInit: optional(fn<({ config }: { config: any }) => void>()),
  onConfigChange: optional(fn<({ config }: { config: any }) => void>()),
  onDestroy: optional(fn<() => void>()),
})

export const apiReferencePluginSchema =
  fn<
    () => {
      name: string
      extensions: Static<typeof openApiExtensionSchema>[]
      views: Static<typeof viewsSchema>
      hooks: Static<typeof lifecycleHooksSchema>
      apiClientPlugins: any[]
    }
  >()
