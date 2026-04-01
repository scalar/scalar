import type { RequestFactory } from '@scalar/workspace-store/request-example'
import { Request as PostmanRequest } from 'postman-collection'

const assertSupported = (condition: boolean, message: string): void => {
  console.assert(condition, `[Scalar Postman adapter] ${message}`)
}

/**
 * Maps Scalar {@link RequestFactory} body data into a Postman Collection request
 * body definition for the sandbox (`pm.request.body`).
 *
 * File/Blob parts are not supported in script context; raw non-string bodies are
 * treated as empty with a console assertion.
 */
const buildPostmanBodyDefinition = (
  body: RequestFactory['body'],
):
  | {
      mode: string
      raw?: string
      urlencoded?: { key: string; value: string }[]
      formdata?: { key: string; type: string; value: string }[]
    }
  | undefined => {
  if (!body) {
    return undefined
  }

  if (body.mode === 'raw') {
    if (typeof body.value === 'string') {
      return { mode: 'raw', raw: body.value }
    }
    assertSupported(false, 'raw body must be a string for pm.request; File/Blob is not supported')
    return { mode: 'raw', raw: '' }
  }

  if (body.mode === 'urlencoded') {
    return {
      mode: 'urlencoded',
      urlencoded: body.value.map(({ key, value }) => ({
        key,
        value,
      })),
    }
  }

  if (body.mode === 'formdata') {
    const unsupported = body.value.filter((item) => item.type !== 'text')
    if (unsupported.length > 0) {
      assertSupported(false, 'formdata file/blob parts are not supported in pm.request.body for scripts')
    }
    return {
      mode: 'formdata',
      formdata: body.value
        .filter((item): item is { type: 'text'; key: string; value: string } => item.type === 'text')
        .map(({ key, value }) => ({
          key,
          type: 'text',
          value,
        })),
    }
  }

  return undefined
}

/**
 * Builds a Postman Collection {@link PostmanRequest} from a workspace-store
 * {@link RequestFactory} so `pm.request` in the sandbox matches Postman’s shape
 * (method, url, headers, body) as closely as practical.
 *
 * @see https://learning.postman.com/docs/tests-and-scripts/write-scripts/postman-sandbox-reference/pm-request/
 */
export const createPostmanRequestFromFactory = (factory: RequestFactory): PostmanRequest => {
  const headerList: { key: string; value: string }[] = []
  factory.headers.forEach((value, key) => {
    headerList.push({
      key,
      value: value,
    })
  })

  const bodyDef = buildPostmanBodyDefinition(factory.body)

  return new PostmanRequest({
    url: factory.baseUrl + factory.path.raw,
    method: factory.method,
    header: headerList,
    body: bodyDef,
  })
}

/**
 * Applies a Postman request definition (e.g. `execution.request` from the sandbox callback after IPC)
 * onto a {@link RequestFactory}. Header and method are copied; URL is not synced to the factory.
 */
export const syncPlainPostmanRequestToRequestFactory = (definition: unknown, factory: RequestFactory): void => {
  if (definition === null || definition === undefined || typeof definition !== 'object') {
    return
  }
  try {
    const reconstructed = new PostmanRequest(definition as ConstructorParameters<typeof PostmanRequest>[0])
    syncPostmanRequestToRequestFactory(reconstructed, factory)
  } catch {
    /** Malformed payload after teleport; leave factory unchanged. */
  }
}

/** Copies header and method from a live {@link PostmanRequest} onto {@link RequestFactory}. */
export const syncPostmanRequestToRequestFactory = (postmanRequest: PostmanRequest, factory: RequestFactory): void => {
  const method = postmanRequest.method
  if (typeof method === 'string' && method.length > 0) {
    factory.method = method.toUpperCase()
  }

  const nextHeaders = new Headers()
  postmanRequest.headers?.each((header) => {
    if (header.disabled) {
      return
    }
    const key = header.key
    if (key) {
      /** `Headers.set` drops prior values for the same name; Postman `headers.add` keeps multiple entries. */
      nextHeaders.append(key, header.value ?? '')
    }
  })
  factory.headers = nextHeaders
}
