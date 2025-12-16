import type { AvailableClient, AvailableClients } from '@scalar/types/snippetz'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'

import {
  type CustomCodeSampleId,
  generateCustomId,
} from '@/v2/blocks/operation-code-sample/helpers/generate-client-options'
import {
  type GenerateCodeSnippetProps,
  generateCodeSnippet,
} from '@/v2/blocks/operation-code-sample/helpers/generate-code-snippet'

/**
 * Wrapper around the generateCodeSnippet helper to handle custom code samples
 *
 * @param clientId - The client ID to generate the code for
 * @param example - The example to generate the code for
 * @param contentType - The content type to generate the code for
 * @param customCodeSamples - The custom code samples to generate the code for
 * @param method - The method to generate the code for
 * @param operation - The operation to generate the code for
 * @param path - The path to generate the code for
 * @param securitySchemes - The security schemes to generate the code for
 * @param server - The server to generate the code for
 * @returns The generated code
 */
export const generateCode = ({
  clientId,
  example,
  contentType,
  customCodeSamples,
  method,
  operation,
  path,
  securitySchemes,
  server,
}: {
  clientId: AvailableClient | CustomCodeSampleId | undefined
  customCodeSamples: XCodeSample[]
} & Omit<GenerateCodeSnippetProps, 'clientId'>): string => {
  try {
    if (!clientId) {
      return ''
    }

    // Use the selected custom example
    if (clientId.startsWith('custom')) {
      return (
        customCodeSamples.find((example) => generateCustomId(example) === clientId)?.source ??
        'Custom example not found'
      )
    }

    return generateCodeSnippet({
      clientId: clientId as AvailableClients[number],
      operation,
      method,
      server,
      securitySchemes,
      contentType,
      path,
      example,
    })
  } catch (error) {
    console.error('[generateSnippet]', error)
    return ''
  }
}
