import { type Static, array, number, object, optional, record, string, union } from '@scalar/validation'

const Header = object({
  name: string(),
  value: string(),
})

export type Header = Static<typeof Header>

const PostDataParam = object({
  name: string(),
  value: optional(string()),
})

const PostDataWithText = object({
  mimeType: string({ typeComment: 'Mime type of posted data.' }),
  text: string(),
})

const PostDataWithParams = object({
  mimeType: string({ typeComment: 'Mime type of posted data.' }),
  params: array(PostDataParam),
})

/** Detailed info about a performed request (HAR-style). */
const Request = object({
  url: string({ typeComment: 'Absolute URL of the request (fragments are not included).' }),
  method: string({ typeComment: 'Request method (`GET`, `POST`, ...).' }),
  httpVersion: string({ typeComment: 'Request HTTP Version.' }),
  headers: array(Header, { typeComment: 'List of header objects.' }),
  cookies: array(Header, { typeComment: 'List of cookie objects.' }),
  headersSize: number({
    typeComment:
      'Total number of bytes from the start of the HTTP request message until (and including) the double CRLF before the body. Set to `-1` if the info is not available.',
  }),
  queryString: array(Header, { typeComment: 'List of query string objects.' }),
  bodySize: number({
    typeComment: 'Size of the request body (POST data payload) in bytes. Set to `-1` if the info is not available.',
  }),
  postData: optional(union([PostDataWithText, PostDataWithParams], { typeComment: 'Posted data info.' })),
})

export type Request = Static<typeof Request>

const ResponseContent = object({
  size: number(),
  mimeType: string(),
  encoding: optional(string()),
  text: optional(string()),
})

const Response = object({
  status: number({ typeComment: 'Response status.' }),
  statusText: string({ typeComment: 'Response status description.' }),
  headers: array(Header),
  cookies: array(Header),
  httpVersion: string({ typeComment: 'Response HTTP Version.' }),
  redirectURL: string({ typeComment: 'Redirection target URL from the Location response header.' }),
  headersSize: number({
    typeComment:
      'Total number of bytes from the start of the HTTP response message until (and including) the double CRLF before the body. Set to `-1` if the info is not available.',
  }),
  bodySize: number({
    typeComment:
      'Size of the received response body in bytes. Set to zero in case of responses coming from the cache (`304`). Set to `-1` if the info is not available.',
  }),
  content: ResponseContent,
})

export type Response = Static<typeof Response>

const HistoryEntry = object({
  time: number({
    typeComment:
      'Total elapsed time of the request in milliseconds. This is the sum of all timings available in the timings object (i.e. not including `-1` values).',
  }),
  timestamp: number({ typeComment: 'Timestamp of the request.' }),
  request: Request,
  response: Response,
  meta: object({
    example: string({ typeComment: 'The example key for the request.' }),
  }),
  requestMetadata: object({
    variables: record(string(), string(), {
      typeComment: 'Variables used in the request. Stored here because HAR format does not support variables.',
    }),
  }),
})

export type HistoryEntry = Static<typeof HistoryEntry>

/**
 * Schema for the path method history.
 *
 * ```json
 * {
 *   "path": {
 *     "method": [Entry]
 *   }
 * }
 * ```
 */
const PathMethodHistorySchema = record(string(), record(string(), array(HistoryEntry)))

export type PathMethodHistory = Static<typeof PathMethodHistorySchema>

/**
 * Schema for the document history.
 *
 * ```json
 * {
 *   "documentName": {
 *     "path": {
 *       "method": [Entry]
 *     }
 *   }
 * }
 * ```
 */
export const DocumentHistorySchema = record(string(), PathMethodHistorySchema)

export type DocumentHistory = Static<typeof DocumentHistorySchema>
