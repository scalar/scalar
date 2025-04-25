import { validateJsonSchema } from './validate-json-schema'

interface HeaderAssertions {
  that: {
    equals: (expectedValue: string) => boolean
    includes: (expectedValue: string) => boolean
  }
}

export type ResponseAssertions = {
  have: {
    status: (expectedStatus: number | string) => boolean
    header: (headerName: string) => HeaderAssertions
    jsonSchema: (schema: object) => boolean
    body: (expectedBody: string) => boolean
  }
  be: {
    json: () => boolean
  }
}

export const createResponseAssertions = (
  response: Omit<Response, 'text' | 'json'> & { text: () => string; json: () => any },
): ResponseAssertions => ({
  have: {
    status: (expectedStatus: number | string) => {
      if (typeof expectedStatus === 'number') {
        if (response.status !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus} but got ${response.status}`)
        }
      } else {
        if (response.statusText !== expectedStatus) {
          throw new Error(`Expected status text "${expectedStatus}" but got "${response.statusText}"`)
        }
      }
      return true
    },
    header: (headerName: string) => ({
      that: {
        equals: (expectedValue: string) => {
          const actualValue = response.headers.get(headerName)
          if (actualValue !== expectedValue) {
            throw new Error(`Expected header "${headerName}" to be "${expectedValue}" but got "${actualValue}"`)
          }
          return true
        },
        includes: (expectedValue: string) => {
          const actualValue = response.headers.get(headerName)
          if (!actualValue?.includes(expectedValue)) {
            throw new Error(`Expected header "${headerName}" to include "${expectedValue}" but got "${actualValue}"`)
          }
          return true
        },
      },
    }),
    // @ts-expect-error TODO: Fix this
    jsonSchema: async (schema: object) => {
      try {
        const responseData = await response.clone().json()
        return validateJsonSchema(responseData, schema)
      } catch (error) {
        throw new Error(`JSON Schema validation failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    body: (expectedBody: string) => {
      const actualBody = response.text()

      if (actualBody !== expectedBody) {
        throw new Error(`Expected body to be "${expectedBody}" but got "${actualBody}"`)
      }

      return true
    },
  },
  be: {
    json: () => {
      try {
        response.json()
        return true
      } catch {
        throw new Error('Expected response to be valid JSON')
      }
    },
  },
})
