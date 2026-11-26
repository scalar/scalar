/**
 * Qualify a response property link without changing the schema's DOM anchor.
 * Use a tilde for escapes so URL routing's percent-decoding leaves the media type intact.
 */
export const qualifyResponsePropertyAnchor = (id: string, responseId: string, mediaType: string): string => {
  const encoded = encodeURIComponent(mediaType).replaceAll('~', '%7E').replaceAll('%', '~')
  return `${responseId}[media=${encoded}]${id.slice(responseId.length)}`
}

/**
 * Read the media type qualifier at the response status boundary. Older links
 * and links to response headers use the original unqualified anchors.
 */
export const parseResponsePropertyAnchor = (id: string): { id: string; mediaType?: string } => {
  const response = /\.responses\.(?:[1-5](?:\d{2}|XX)|default)(?=\.|\[|$)/.exec(id)
  if (!response) {
    return { id }
  }

  const statusEnd = response.index + response[0].length
  const qualifier = /^\[media=([\w.!'()*~-]+)\](?=\.)/.exec(id.slice(statusEnd))
  if (!qualifier?.[1]) {
    return { id }
  }

  try {
    return {
      id: id.slice(0, statusEnd) + id.slice(statusEnd + qualifier[0].length),
      mediaType: decodeURIComponent(qualifier[1].replaceAll('~', '%')),
    }
  } catch {
    return { id }
  }
}
