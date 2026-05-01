import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/**
 * Re-exported from `@scalar/helpers/types/result` so the rest of the
 * workspace-store codebase keeps importing `Result` from a colocated
 * module while the canonical definition lives in helpers.
 */
export type { Result } from '@scalar/helpers/types/result'

export type RequestExampleMeta = {
  path: string
  method: HttpMethod
  exampleName: string
}
