import { getResponseStringFromSchema } from './getResponseStringFromSchema'

export const getExampleResponses = (responses: Record<string, any>) => {
  const exampleResponses: Record<string, any> = {}

  Object.keys(responses).forEach((responseCode) => {
    const jsonResponseSchema = responses[responseCode]?.content
      ? responses[responseCode]?.content['application/json']?.schema
      : undefined

    if (jsonResponseSchema !== undefined) {
      if (exampleResponses[responseCode] === undefined) {
        exampleResponses[responseCode] = {}
      }

      exampleResponses[responseCode]['application/json'] = {
        headers: responses[responseCode].content['application/json']['headers'],
        content: JSON.parse(getResponseStringFromSchema(jsonResponseSchema)),
      }
    }
  })

  return exampleResponses
}
