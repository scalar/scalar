import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/**
 * Re-exported from `@scalar/helpers/types/result` so the rest of the
 * workspace-store codebase keeps importing `Result` from a colocated
 * module while the canonical definition lives in helpers.
 */
export type { Result } from '@scalar/helpers/types/result'

export type RequestExampleMeta = {
  /**
   * For operations, the request path (e.g. `/pets`). For webhooks, the webhook name
   * from `document.webhooks` (e.g. `newPet`). Disambiguated by `isWebhook`.
   */
  path: string
  method: HttpMethod
  exampleName: string
  /**
   * When true, `path` is treated as a webhook name and the operation is resolved from
   * `document.webhooks` instead of `document.paths`. Webhooks describe outbound requests
   * the API server makes; the destination URL comes from the operation's servers or a
   * user-supplied URL, not from the webhook name itself.
   */
  isWebhook?: boolean
}
