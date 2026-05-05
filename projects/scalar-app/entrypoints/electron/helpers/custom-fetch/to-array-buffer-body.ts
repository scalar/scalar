/**
 * Convert a DOM `BodyInit` to an `ArrayBuffer` so it can be transferred over
 * IPC via the structured clone algorithm. Returns `undefined` for absent bodies.
 */
export const toArrayBufferBody = (body: BodyInit | null | undefined): Promise<ArrayBuffer | undefined> => {
  if (!body) {
    return Promise.resolve(undefined)
  }
  if (body instanceof ArrayBuffer) {
    return Promise.resolve(body)
  }
  return new Response(body).arrayBuffer()
}
