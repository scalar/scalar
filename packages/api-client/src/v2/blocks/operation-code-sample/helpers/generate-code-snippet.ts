import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { AvailableClients, ClientId, TargetId } from '@scalar/snippetz'
import type {
  OperationObject,
  SecuritySchemeObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { operationToHar } from '@/v2/blocks/operation-code-sample/helpers/operation-to-har/operation-to-har'
import { getSnippet } from '@/views/Components/CodeSnippet/helpers/get-snippet'

type Props = {
  clientId: AvailableClients[number]
  operation: OperationObject
  example?: string | undefined
  method: HttpMethod
  path: string
  contentType?: string | undefined
  server?: ServerObject | undefined
  securitySchemes?: SecuritySchemeObject[] | undefined
}

/** Generate the code snippet for the selected example OR operation */
export const generateCodeSnippet = ({
  clientId,
  operation,
  method,
  path,
  example,
  contentType,
  server,
  securitySchemes,
}: Props): string => {
  try {
    const harRequest = operationToHar({
      operation,
      contentType,
      method,
      path,
      server,
      securitySchemes,
      example,
    })

    const [targetKey, clientKey] = clientId.split('/') as [TargetId, ClientId<TargetId>]

    const [error, payload] = getSnippet(targetKey, clientKey, harRequest)
    if (error) {
      console.error('[generateCodeSnippet]', error)
      return error.message ?? 'Error generating code snippet'
    }

    return payload
  } catch (error) {
    console.error('[generateCodeSnippet]', error)
    return 'Error generating code snippet'
  }
}
