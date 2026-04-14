import { any, boolean, nullable, object, optional, record, string, union, unknown } from '@scalar/validation'

/**
 * The content of an OpenAPI document — a string, null, a generic record, or a
 * function returning a record. Because the validation package has no function
 * schema, we use `unknown()` for that branch.
 */

// TODO: support function types??
const contentSchema = union([string(), nullable(), record(string(), any()), unknown()])

/**
 * A source is any potential document input used for API Reference
 * and API Client integrations. Sources may be specified in the configuration
 * or used independently. Some configurations may have multiple sources.
 */
export const sourceConfigurationSchema = object({
  default: optional(boolean()),
  url: optional(string()),
  content: optional(contentSchema),
  title: optional(string()),
  slug: optional(string()),
  spec: optional(
    object({
      url: optional(string()),
      content: optional(contentSchema),
    }),
  ),
  agent: optional(
    object({
      key: optional(string()),
      disabled: optional(boolean()),
      hideAddApi: optional(boolean()),
    }),
  ),
})
