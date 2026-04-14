import { string, unknown, object, optional, record, any, array } from "@scalar/validation";

export const openApiExtensionSchema = object({
  name: string({
    typeComment: `Name of specification extension property. Has to start with \`x-\`.`,
  }),
  component: unknown({
    typeComment: `Vue component to render the specification extension`,
  }),
  renderer: optional(unknown({
    typeComment: `Custom renderer to render the specification extension`,
  })),
})

export const viewComponentSchema = object({
  component: unknown({
    typeComment: `Vue component to render in the view`,
  }),
  renderer: optional(unknown({
    typeComment: `Custom renderer to render the view component (e.g., ReactRenderer)`,
  })),
  props: optional(record(string(), any()), {
    typeComment: `Additional props to pass to the component`,
  }),
})

export const viewsSchema = object({
  'content.end': optional(array(viewComponentSchema), {
    typeComment: `Components to render at specific views in the API Reference`,
  }),
})

export const apiReferencePluginSchema = unknown()