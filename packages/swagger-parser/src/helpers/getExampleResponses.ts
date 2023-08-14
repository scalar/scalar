import { generateResponseContent } from './generateResponseContent'

export const getExampleResponses = (responses: Record<string, any>) => {
  const exampleResponses: Record<string, any> = {}

  Object.keys(responses).forEach((responseCode) => {
    // Let’s copy the raw information to a new property and apply the transformations there.
    exampleResponses[responseCode] = responses[responseCode]

    // Let’s see if there’s schema for JSON responses defined …
    const jsonResponseSchema =
      responses[responseCode]?.content?.['application/json']?.schema

    // If the response has a JSON schema, generate an example response.
    if (jsonResponseSchema !== undefined) {
      // Actually generate the example response content.
      exampleResponses[responseCode].content['application/json'].body =
        JSON.stringify(
          generateResponseContent(jsonResponseSchema.properties),
          null,
          2,
        )
    }
  })

  return exampleResponses
}
