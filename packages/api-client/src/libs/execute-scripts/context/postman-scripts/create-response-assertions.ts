import { validateJsonSchema } from './validate-json-schema'

interface HeaderAssertions {
  that: {
    equals: (expectedValue: string) => boolean
    includes: (expectedValue: string) => boolean
  }
}

export type ResponseAssertions = {
  have: {
    status: (expectedStatus: number) => boolean
    header: (headerName: string) => HeaderAssertions
    jsonSchema: (schema: object) => Promise<boolean>
  }
  be: {
    json: () => Promise<boolean>
  }
}

export const createResponseAssertions = (response: Response): ResponseAssertions => ({
  have: {
    status: (expectedStatus: number) => {
      if (response.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus} but got ${response.status}`)
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
    jsonSchema: async (schema: object) => {
      try {
        const responseData = await response.clone().json()
        return validateJsonSchema(responseData, schema)
      } catch (error) {
        throw new Error(`JSON Schema validation failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
  },
  be: {
    json: async () => {
      try {
        await response.json()
        return true
      } catch {
        throw new Error('Expected response to be valid JSON')
      }
    },
  },
})
