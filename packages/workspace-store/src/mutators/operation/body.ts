import type { OperationEvents } from '@/events/definitions/operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import type { WorkspaceDocument } from '@/schemas'
import type { ExampleObject } from '@/schemas/v3.1/strict/example'

/** Ensure the json that we need exists up to the example object in the request body */
const findOrCreateRequestBodyExample = (
  document: WorkspaceDocument | null,
  contentType: string,
  meta: OperationEvents['operation:update:requestBody:contentType']['meta'],
): ExampleObject | null => {
  const operation = getResolvedRef(document?.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return null
  }

  // Ensure that the request body exists
  let requestBody = getResolvedRef(operation.requestBody)
  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  // Ensure that the example exists
  requestBody.content[contentType] ||= {}
  requestBody.content[contentType].examples ||= {}
  requestBody.content[contentType].examples[meta.exampleKey] ||= {}

  const example = getResolvedRef(requestBody.content[contentType].examples?.[meta.exampleKey])
  return example ?? null
}

/**
 * Sets the selected request-body content type for the current `exampleKey`.
 * This stores the selection under `x-scalar-selected-content-type` on the
 * resolved requestBody. Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * updateOperationRequestBodyContentType({
 *   document,
 *   meta: { method: 'post', path: '/upload', exampleKey: 'default' },
 *   payload: { contentType: 'multipart/form-data' },
 * })
 * ```
 */
export const updateOperationRequestBodyContentType = (
  document: WorkspaceDocument | null,
  { meta, payload }: OperationEvents['operation:update:requestBody:contentType'],
) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return
  }

  let requestBody = getResolvedRef(operation.requestBody)
  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  if (!requestBody!['x-scalar-selected-content-type']) {
    requestBody!['x-scalar-selected-content-type'] = {}
  }

  requestBody!['x-scalar-selected-content-type'][meta.exampleKey] = payload.contentType
}

/**
 * Creates or updates a concrete example value for a specific request-body
 * `contentType` and `exampleKey`. Safely no-ops if the document or operation
 * does not exist.
 *
 * Example:
 * ```ts
 * updateOperationRequestBodyExample({
 *   document,
 *   contentType: 'application/json',
 *   meta: { method: 'post', path: '/users', exampleKey: 'default' },
 *   payload: { value: JSON.stringify({ name: 'Ada' }) },
 * })
 * ```
 */
export const updateOperationRequestBodyExample = (
  document: WorkspaceDocument | null,
  { meta, payload, contentType }: OperationEvents['operation:update:requestBody:value'],
) => {
  const example = findOrCreateRequestBodyExample(document, contentType, meta)
  if (!example) {
    console.error('Example not found', meta.exampleKey)
    return
  }

  example.value = payload
}

/**
 * Stores the form data for the request body example
 *
 * This needs special handling as we store it as an array of objects with a schema type of object
 */
export const updateOperationRequestBodyFormValue = (
  document: WorkspaceDocument | null,
  { meta, payload, contentType }: OperationEvents['operation:update:requestBody:formValue'],
) => {
  const example = findOrCreateRequestBodyExample(document, contentType, meta)
  if (!example) {
    console.error('Example not found', meta.exampleKey)
    return
  }

  example.value = unpackProxyObject(payload, { depth: 3 })
}
