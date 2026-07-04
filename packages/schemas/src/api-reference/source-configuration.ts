import { any, boolean, fn, literal, nullable, object, optional, record, string, union } from '@scalar/validation'

/**
 * The content of an OpenAPI document. Accepts any of:
 *  - a raw string (YAML or JSON),
 *  - `null` to explicitly opt out of inline content,
 *  - a plain object representing the parsed document, or
 *  - a function that returns either of the above (sync or async resolution
 *    happens further downstream).
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
    typeComment:
      'Directly embed the OpenAPI document. Can be a string, object, function returning an object, or null. It is recommended to pass a URL instead of content.',
  }),
  documentType: optional(union([literal('openapi'), literal('asyncapi')]), {
    typeComment:
      "The type of the document. If not set, the type is auto-detected from the document content (an 'asyncapi' version field vs an 'openapi'/'swagger' version field). Set it to be explicit.",
  }),
  title: optional(string(), {
    typeComment:
      'The title of the OpenAPI document. Used for the page title and the document name in the dropdown. With multiple `sources`, set this per source.',
  }),
  slug: optional(string(), {
    typeComment:
      'The slug of the OpenAPI document used in the URL. If none is passed, the title will be used. With multiple `sources`, set this per source.',
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
        typeComment:
          'When true, hide the control to add more APIs in the agent chat. Only preloaded/registry documents are shown; the public API list is not offered.',
      }),
    }),
    {
      typeComment: 'Agent Scalar configuration',
    },
  ),
})
