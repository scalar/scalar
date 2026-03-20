import type { HttpMethod } from '@scalar/helpers/http/http-methods'

export type Result<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: string
    }

export type RequestExampleMeta = {
  path: string
  method: HttpMethod
  exampleName: string
}
