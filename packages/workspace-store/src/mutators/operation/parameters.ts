import type { OperationEvents } from '@/events/definitions/operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import type { WorkspaceDocument } from '@/schemas'
import type { DisableParametersConfig } from '@/schemas/extensions/operation/x-scalar-disable-parameters'

/**
 * Updates an existing parameter of a given `type` by its index within that
 * type subset (e.g. the N-th query parameter). Supports updating name, value,
 * and enabled state for the targeted example.
 * Safely no-ops if the document, operation, or parameter does not exist.
 *
 * Example:
 * ```ts
 * updateOperationParameter({
 *   document,
 *   type: 'query',
 *   index: 0,
 *   meta: { method: 'get', path: '/search', exampleKey: 'default' },
 *   payload: { value: 'alice', isDisabled: false },
 * })
 * ```
 */
export const upsertOperationParameter = (
  document: WorkspaceDocument | null,
  { meta, type, payload, originalParameter }: OperationEvents['operation:upsert:parameter'],
) => {
  // We are editing an existing parameter
  if (originalParameter) {
    originalParameter.name = payload.name

    if (!originalParameter.examples) {
      originalParameter.examples = {}
    }

    // Create the example if it doesn't exist
    originalParameter.examples[meta.exampleKey] ||= {}
    const example = getResolvedRef(originalParameter.examples[meta.exampleKey])!

    // Update the example value and disabled state
    example.value = payload.value
    example['x-disabled'] = payload.isDisabled
    return
  }

  // We are adding a new parameter
  const operation = getResolvedRef(document?.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    console.error('Operation not found', { meta, document })
    return
  }

  operation.parameters ||= []
  operation.parameters.push({
    name: payload.name,
    in: type,
    required: type === 'path' ? true : false,
    examples: {
      [meta.exampleKey]: {
        value: payload.value,
        // We always want a new parameter to be enabled by default
        'x-disabled': false,
      },
    },
  })
  return
}

/**
 * Updates the disabled state of a default parameter for an operation.
 * Default parameters are inherited from higher-level configurations (like collection or server defaults)
 * and this allows individual operations to selectively disable them without removing them entirely.
 *
 * The disabled state is stored in the `x-scalar-disable-parameters` extension object, organized by
 * parameter type and example key. Missing objects are initialized automatically.
 *
 * @param document - The current workspace document
 * @param type - The parameter type (e.g., 'header'). Determines the storage key ('default-headers' for headers)
 * @param meta.path - Path of the operation (e.g., '/users')
 * @param meta.method - HTTP method of the operation (e.g., 'get')
 * @param meta.exampleKey - Key identifying the relevant example
 * @param meta.key - The specific parameter key being updated
 * @param payload.isDisabled - Whether the parameter should be disabled
 */
export const updateOperationExtraParameters = (
  document: WorkspaceDocument | null,
  { type, meta, payload, in: location }: OperationEvents['operation:update:extra-parameters'],
) => {
  type Type = OperationEvents['operation:update:extra-parameters']['type']
  type In = OperationEvents['operation:update:extra-parameters']['in']

  // Ensure there's a valid document
  if (!document) {
    return
  }

  // Resolve the referenced operation from the document using the path and method
  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return
  }

  // Initialize the 'x-scalar-disable-parameters' object if it doesn't exist
  if (!operation['x-scalar-disable-parameters']) {
    operation['x-scalar-disable-parameters'] = {}
  }

  /**
   * Maps parameter type and location to the corresponding config key.
   * Only valid combinations are defined here.
   */
  const mapping: Partial<Record<Type, Partial<Record<In, keyof DisableParametersConfig>>>> = {
    global: { cookie: 'global-cookies' },
    default: { header: 'default-headers' },
  }

  const key = mapping[type]?.[location]

  if (!key) {
    return
  }

  // Initialize the 'default-headers' object within 'x-scalar-disable-parameters' if it doesn't exist
  if (!operation['x-scalar-disable-parameters'][key]) {
    operation['x-scalar-disable-parameters'][key] = {}
  }

  // Update (or create) the entry for the specific example and key, preserving any existing settings
  operation['x-scalar-disable-parameters'][key][meta.exampleKey] = {
    ...(operation['x-scalar-disable-parameters'][key][meta.exampleKey] ?? {}),
    [meta.name]: payload.isDisabled ?? false,
  }
}

/**
 * Removes a parameter from the operation OR path
 *
 * Example:
 * ```ts
 * deleteOperationParameter({
 *   document,
 *   originalParameter,
 *   meta: { method: 'get', path: '/users', exampleKey: 'default' },
 * })
 * ```
 */
export const deleteOperationParameter = (
  document: WorkspaceDocument | null,
  { meta, originalParameter }: OperationEvents['operation:delete:parameter'],
) => {
  const operation = getResolvedRef(document?.paths?.[meta.path]?.[meta.method])

  // Lets check if its on the operation first as its more likely
  const operationIndex = operation?.parameters?.findIndex((it) => getResolvedRef(it) === originalParameter) ?? -1

  // We cannot call splice on a proxy object, so we unwrap the array and filter it
  if (operation && operationIndex >= 0) {
    operation.parameters = unpackProxyObject(
      operation.parameters?.filter((_, i) => i !== operationIndex),
      { depth: 1 },
    )
    return
  }

  // If it wasn't on the operation it might be on the path
  const path = getResolvedRef(document?.paths?.[meta.path])
  const pathIndex = path?.parameters?.findIndex((it) => getResolvedRef(it) === originalParameter) ?? -1

  if (path && pathIndex >= 0) {
    path.parameters = unpackProxyObject(
      path.parameters?.filter((_, i) => i !== pathIndex),
      { depth: 1 },
    )
  }
}

/**
 * Deletes all parameters of a given `type` from the operation.
 * Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * deleteAllOperationParameters({
 *   document,
 *   type: 'cookie',
 *   meta: { method: 'get', path: '/users' },
 * })
 * ```
 */
export const deleteAllOperationParameters = (
  document: WorkspaceDocument | null,
  { meta, type }: OperationEvents['operation:delete-all:parameters'],
) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return
  }

  // Filter out parameters of the specified type
  operation.parameters = operation.parameters?.filter((it) => getResolvedRef(it).in !== type) ?? []
}
