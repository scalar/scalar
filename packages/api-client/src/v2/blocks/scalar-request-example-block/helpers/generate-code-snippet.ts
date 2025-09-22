import type { AvailableClients, ClientId, TargetId } from '@scalar/snippetz'
import { operationToHar } from '@scalar/oas-utils/helpers/operation-to-har'
import { getSnippet } from '@scalar/api-client/views/Components/CodeSnippet'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type {
  ServerObject,
  OperationObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

type Props = {
  clientId: AvailableClients[number]
  operation: OperationObject
  example: unknown
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
    return error.message ?? 'Error generating code snippet'
  }

  return payload
}
