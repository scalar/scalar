import { vi } from 'vitest'

type MockContextOptions = {
  /** Request headers to return from c.req.header() */
  requestHeaders?: Record<string, string>
  /** Request body text to return from c.req.text() */
  requestBody?: string
  /** Parsed form data to return from c.req.parseBody() */
  formData?: Record<string, unknown>
  /** HTTP method */
  method?: string
  /** Request path */
  path?: string
  /** Query parameters (values as arrays for queries(), single values for query()) */
  query?: Record<string, string[]>
}

/** Creates a mock Hono Context for testing */
export function createMockContext(options: MockContextOptions = {}) {
  const { requestHeaders = {}, requestBody = '', formData = {}, method = 'GET', path = '/', query = {} } = options

  const responseHeaders: Record<string, string> = {}
  let htmlContent = ''
  let jsonContent: Record<string, unknown> | null = null
  let textContent = ''
  let bodyContent: string | null = null

  return {
    header: vi.fn((key: string, value: string) => {
      responseHeaders[key] = value
    }),
    html: vi.fn((content: unknown) => {
      // Handle HtmlEscapedString (nested array structure) from Hono's html tagged template
      const flatten = (val: unknown): string => {
        if (typeof val === 'string') {
          return val
        }
        if (Array.isArray(val)) {
          return val.map(flatten).join('')
        }
        return String(val ?? '')
      }
      htmlContent = flatten(content)
      return htmlContent
    }),
    json: vi.fn((data: Record<string, unknown>) => {
      jsonContent = data
      return data
    }),
    text: vi.fn((content: string, _status?: number, headers?: Record<string, string>) => {
      textContent = content
      if (headers) {
        Object.assign(responseHeaders, headers)
      }
      return content
    }),
    body: vi.fn((content: string) => {
      bodyContent = content
      return content
    }),
    /** Mock request object */
    req: {
      method,
      path,
      header: vi.fn((key: string) => requestHeaders[key]),
      text: vi.fn(async () => requestBody),
      parseBody: vi.fn(async () => formData),
      queries: vi.fn(() => ({ ...query })),
      query: vi.fn((key: string) => query[key]?.[0]),
      raw: {
        headers: new Headers(requestHeaders),
      },
    },
    /** Helper to access captured response headers in tests */
    _headers: responseHeaders,
    /** Helper to access captured HTML content in tests */
    _getHtmlContent: () => htmlContent,
    /** Helper to access captured JSON content in tests */
    _getJsonContent: () => jsonContent,
    /** Helper to access captured text content in tests */
    _getTextContent: () => textContent,
    /** Helper to access captured body content in tests */
    _getBodyContent: () => bodyContent,
  }
}
