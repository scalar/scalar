import { generateResponseContent } from './generateResponseContent'

export const getExampleResponses = (responses: Record<string, any>) => {
  if (!responses) return
  const exampleResponses: Record<string, any> = {}

  Object.keys(responses).forEach((responseCode) => {
    // Let’s copy the raw information to a new property and apply the transformations there.
    exampleResponses[responseCode] = responses[responseCode]

    // If has a single example, us it.
    const jsonResponseExample =
      responses[responseCode]?.content?.['application/json']?.example
    if (jsonResponseExample !== undefined) {
      exampleResponses[responseCode].content['application/json'].example =
        JSON.stringify(jsonResponseExample, null, 2)

      return
    }

    // If has multiple examples, us them all.
    const jsonResponseExamples =
      responses[responseCode]?.content?.['application/json']?.examples
    if (jsonResponseExamples !== undefined) {
      exampleResponses[responseCode].content['application/json'].examples =
        JSON.stringify(jsonResponseExamples, null, 2)

      return
    }

    // Let’s see if there’s schema for JSON responses defined …
    const jsonResponseSchema =
      responses[responseCode]?.content?.['application/json']?.schema

    // If the response has a JSON schema, generate an example response.
    if (jsonResponseSchema !== undefined) {
      exampleResponses[responseCode].headers = responses[responseCode].headers
      // Actually generate the example response content.
      exampleResponses[responseCode].content['application/json'].example =
        JSON.stringify(generateResponseContent(jsonResponseSchema), null, 2)
    }
  })

  return exampleResponses
}
