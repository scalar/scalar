import { type ResponseAssertions, createResponseAssertions } from './create-response-assertions'

export type ResponseUtils = {
  json: () => any
  text: () => string
  code: number
  statusText: string
  headers: Record<string, string>
  to: ResponseAssertions
  responseTime: number
}

export const createResponseUtils = (response: Response): ResponseUtils => {
  let cachedJson: any
  let cachedText: string | undefined

  const responseStartTime = performance.now()

  return {
    json: () => {
      if (cachedJson === undefined) {
        throw new Error('JSON response not ready. This is likely a bug.')
      }
      if (cachedJson === null) {
        throw new Error('Response is not valid JSON')
      }
      return cachedJson
    },
    text: () => {
      if (cachedText === undefined) {
        throw new Error('Text response not ready. This is likely a bug.')
      }

      return cachedText
    },
    code: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    to: createResponseAssertions({
      status: response.status,
      statusText: response.statusText,
      // @ts-expect-error TODO: Fix this
      headers: Object.fromEntries(response.headers.entries()),
      json: () => cachedJson,
      // @ts-expect-error TODO: Fix this
      text: () => cachedText,
    }),
    get responseTime() {
      // TODO: Use actual response time
      return Number((performance.now() - responseStartTime).toFixed(2))
    },
  }
}
