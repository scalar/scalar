import { any, boolean, fn, nullable, object, optional, record, string, union } from '@scalar/validation'

/**
 * The content of an OpenAPI document — a string, null, a generic record, or a
 * function returning a record. Because the validation package has no function
 * schema, we use `unknown()` for that branch.
 */
const contentSchema = union([string(), nullable(), record(string(), any()), fn<() => string | any>()])

/**
 * A source is any potential document input used for API Reference
 * and API Client integrations. Sources may be specified in the configuration
 * or used independently. Some configurations may have multiple sources.
 */
export const sourceConfigurationSchema = object({
  default: boolean({ default: false }),
  url: optional(string(), {
    typeComment: 'URL to an OpenAPI/Swagger document',
  }),
  content: optional(contentSchema, {
    typeComment: 'Directly embed the OpenAPI document. Can be a string, object, function returning an object, or null. It is recommended to pass a URL instead of content.',
  }),
  title: optional(string(), {
    typeComment: 'The title of the OpenAPI document. @deprecated Please move `title` to the top level and remove the `spec` prefix.',
  }),
  slug: optional(string(), {
    typeComment: 'The slug of the OpenAPI document used in the URL. @deprecated Please move `slug` to the top level and remove the `spec` prefix.',
  }),
  spec: optional(
    object({
      url: optional(string()),
      content: optional(contentSchema),
    }),
    {
      typeComment: '@deprecated Use `url` and `content` on the top level instead.',
    },
  ),
  agent: optional(
    object({
      key: optional(string()),
      disabled: optional(boolean()),
      hideAddApi: optional(boolean(), {
        typeComment: 'When true, hide the control to add more APIs in the agent chat. Only preloaded/registry documents are shown; the public API list is not offered.',
      }),
    }),
    {
      typeComment: 'Agent Scalar configuration',
    },
  ),
})
