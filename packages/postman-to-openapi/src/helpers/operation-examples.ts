import type { OpenAPIV3_1 } from '@scalar/openapi-types'

export const getExampleNames = (path: OpenAPIV3_1.PathItemObject) => {
  const exampleNames = new Set<string>()

  Object.values(path).forEach((operation: OpenAPIV3_1.OperationObject) => {
    if ('parameters' in operation) {
      operation.parameters?.forEach((parameter) => {
        if (parameter.examples) {
          for (const exampleName of Object.keys(parameter.examples)) {
            exampleNames.add(exampleName)
          }
        }
      })
    }

    if ('requestBody' in operation) {
      const requestBody = operation.requestBody
      if (requestBody?.content) {
        for (const mediaTypeObject of Object.values(requestBody.content)) {
          const examples =
            mediaTypeObject &&
            typeof mediaTypeObject === 'object' &&
            'examples' in mediaTypeObject &&
            typeof (mediaTypeObject as OpenAPIV3_1.MediaTypeObject).examples === 'object'
              ? (mediaTypeObject as OpenAPIV3_1.MediaTypeObject).examples
              : undefined
          if (examples) {
            for (const exampleName of Object.keys(examples)) {
              exampleNames.add(exampleName)
            }
          }
        }
      }
    }
  })

  return exampleNames
}

export const renameOperationExamples = (
  operation: OpenAPIV3_1.OperationObject,
  exampleName: string,
  newExampleName: string,
) => {
  if ('parameters' in operation) {
    operation.parameters?.forEach((parameter) => {
      if (parameter.examples) {
        parameter.examples[newExampleName] = parameter.examples[exampleName]
        delete parameter.examples[exampleName]
      }
    })
  }
  if ('requestBody' in operation) {
    Object.values(operation.requestBody?.content ?? {}).forEach((mediaTypeObject) => {
      if (
        (mediaTypeObject as OpenAPIV3_1.MediaTypeObject).examples &&
        typeof (mediaTypeObject as OpenAPIV3_1.MediaTypeObject).examples === 'object'
      ) {
        const mediaCasted = mediaTypeObject as OpenAPIV3_1.MediaTypeObject
        mediaCasted.examples ??= {}
        mediaCasted.examples[newExampleName] = mediaCasted.examples[exampleName]!
        delete mediaCasted.examples[exampleName]
      }
    })
  }
}
