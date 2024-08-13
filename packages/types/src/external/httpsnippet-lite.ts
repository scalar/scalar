/**
 * These types are copied from httpsnippet-lite to reduce depenedencies
 */

export type Param = {
  /** name of a posted parameter. */
  name: string
  /** value of a posted parameter or content of a posted file */
  value?: string | undefined
  /** name of a posted file. */
  fileName?: string | undefined
  /** content type of a posted file. */
  contentType?: string | undefined
  /**  A comment provided by the user or the application */
  comment?: string | undefined
}

export type PostDataCommon = {
  /** Mime type of posted data. */
  mimeType: string
  /**  A comment provided by the user or the application */
  comment?: string | undefined
}

type PostDataBase = PostDataCommon & {
  text?: string
  params?: Param[]
}

export type Cookie = {
  /** The name of the cookie. */
  name: string
  /** The cookie value. */
  value: string
  /** The path pertaining to the cookie. */
  path?: string | undefined
  /** The host of the cookie. */
  domain?: string | undefined
  /**
   * Cookie expiration time.
   * (ISO 8601 - `YYYY-MM-DDThh:mm:ss.sTZD`,
   * e.g. `2009-07-24T19:20:30.123+02:00`).
   */
  expires?: string | undefined
  /** Set to true if the cookie is HTTP only, false otherwise. */
  httpOnly?: boolean | undefined
  /** True if the cookie was transmitted over ssl, false otherwise. */
  secure?: boolean | undefined
  /**  A comment provided by the user or the application */
  comment?: string | undefined
}

/**
 * This object represents a headers (used in `request` and `response` objects).
 *
 * http://www.softwareishard.com/blog/har-12-spec/#headers
 */
export type Header = {
  name: string
  value: string
  /**  A comment provided by the user or the application */
  comment?: string | undefined
}
/**
 * This object represents a parameter & value parsed from a query string,
 * if any (embedded in `request` object).
 *
 * http://www.softwareishard.com/blog/har-12-spec/#queryString
 */
export type QueryString = {
  name: string
  value: string
  /**  A comment provided by the user or the application */
  comment?: string | undefined
}

/**
 * Post data with `params` specified.
 */
export type PostDataParams = {
  /**
   * List of posted parameters (in case of URL encoded parameters).
   */
  params: Param[]

  /**
   * _`params` and `text` fields are mutually exclusive._
   */
  text?: never | undefined
}

/**
 * Post data with `text` specified.
 */
export type PostDataText = {
  /**
   * Plain text posted data
   */
  text: string

  /**
   * _`params` and `text` fields are mutually exclusive._
   */
  params?: never | undefined
}

/**
 * This object describes posted data, if any (embedded in `request` object).
 *
 * http://www.softwareishard.com/blog/har-12-spec/#postData
 */
export type PostData = PostDataCommon & (PostDataParams | PostDataText)

export type Request = {
  /** Request method (`GET`, `POST`, ...). */
  method: string
  /** Absolute URL of the request (fragments are not included). */
  url: string
  /** Request HTTP Version. */
  httpVersion: string
  /** List of cookie objects. */
  cookies: Cookie[]
  /** List of header objects. */
  headers: Header[]
  /** List of query parameter objects. */
  queryString: QueryString[]
  /** Posted data info. */
  postData?: PostData | undefined
  /**
   * Total number of bytes from the start of the HTTP request message until
   * (and including) the double CRLF before the body.
   *
   * Set to `-1` if the info is not available.
   */
  headersSize: number
  /**
   * Size of the request body (POST data payload) in bytes.
   *
   * Set to `-1` if the info is not available.
   */
  bodySize: number
  /**  A comment provided by the user or the application */
  comment?: string | undefined
}

export type HarRequest = Omit<Request, 'postData'> & {
  postData?: PostDataBase
}

export type TargetId =
  | 'c'
  | 'clojure'
  | 'csharp'
  | 'go'
  | 'http'
  | 'java'
  | 'javascript'
  | 'kotlin'
  | 'node'
  | 'objc'
  | 'ocaml'
  | 'php'
  | 'powershell'
  | 'python'
  | 'r'
  | 'ruby'
  | 'shell'
  | 'swift'
