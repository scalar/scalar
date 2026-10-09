import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { getExample } from '@/request-example/builder/helpers/get-example'
import type { ExampleObject, MediaTypeObject, OperationObject } from '@/schemas/v3.2/strict/openapi-document'

/** The request body and parameter examples needed by a single request, never its responses. */
export const getOperationExamples = (
  operation: OperationObject,
  key: string,
  contentType?: string,
): (ExampleObject | undefined)[] => {
  const body = getResolvedRef(operation.requestBody)
  return [
    body ? getExample(body, key, contentType) : undefined,
    ...(operation.parameters ?? []).map((parameter) => {
      const resolved = getResolvedRef(parameter)
      return resolved ? getExample(resolved, key, undefined) : undefined
    }),
  ]
}

/** Overlay fetched values for request consumers without persisting them as document edits. */
export const resolveOperationExamples = (
  operation: OperationObject,
  key: string,
  contentType: string | undefined,
  resolve: (example: ExampleObject | undefined) => ExampleObject | undefined,
): OperationObject => {
  const mapMedia = (media: MediaTypeObject): MediaTypeObject => {
    const selected = key || Object.keys(media.examples ?? {})[0]
    const example = selected ? getResolvedRef(media.examples?.[selected]) : undefined
    const resolved = resolve(example)
    return selected && resolved && resolved !== example
      ? { ...media, examples: { ...media.examples, [selected]: resolved } }
      : media
  }
  const body = getResolvedRef(operation.requestBody)
  const type = contentType ?? Object.keys(body?.content ?? {})[0]
  return {
    ...operation,
    ...(body && type && body.content[type]
      ? {
          requestBody: { ...body, content: { ...body.content, [type]: mapMedia(body.content[type]) } },
        }
      : {}),
    parameters: operation.parameters?.map((parameter) => {
      const resolved = getResolvedRef(parameter)
      if (!resolved) return parameter
      const content = 'content' in resolved ? resolved.content : undefined
      const mediaType = Object.keys(content ?? {})[0]
      if (mediaType && content?.[mediaType]) {
        const media = mapMedia(content[mediaType])
        return media === content[mediaType] ? parameter : { ...resolved, content: { ...content, [mediaType]: media } }
      }
      // Keep editable source objects when there is no downloaded example to overlay.
      const media = mapMedia(resolved)
      return media === resolved ? parameter : { ...resolved, ...media }
    }),
  }
}
