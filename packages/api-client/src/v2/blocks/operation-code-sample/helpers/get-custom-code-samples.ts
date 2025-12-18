import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Grabs any custom code samples from the operation
 *
 * @param operation - The operation to get the custom code samples from
 * @returns An array of custom code samples which exist in the operation
 */
export const getCustomCodeSamples = (operation: OperationObject): XCodeSample[] => {
  const customCodeKeys = ['x-custom-examples', 'x-codeSamples', 'x-code-samples'] as const
  return customCodeKeys.flatMap((key) => operation[key] ?? [])
}
