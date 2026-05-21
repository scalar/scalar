import { array, boolean, intersection, lazy, object, optional, record, string } from '@scalar/validation'

import { XInternal, XScalarIgnore } from '@/extensions/document'
import { XPostResponse, XPreRequest } from '@/extensions/general'
import {
  XBadges,
  XCodeSamples,
  XDraftExamples,
  XScalarDisableParameters,
  XScalarStability,
} from '@/extensions/operation'
import { XScalarSelectedServer } from '@/extensions/server'
import { callback } from '@/openapi/3.1/callback'
import { externalDocs } from '@/openapi/3.1/external-docs'
import { parameter } from '@/openapi/3.1/parameter'
import { recursiveRef } from '@/openapi/3.1/reference'
import { requestBody } from '@/openapi/3.1/request-body'
import { responsesObject } from '@/openapi/3.1/response'
import { securityRequirement } from '@/openapi/3.1/security-requirement'
import { server } from '@/openapi/3.1/server'

export const operation = intersection(
  [
    object({
      tags: optional(
        array(string(), {
          typeComment:
            'A list of tags for API documentation control. Tags can be used for logical grouping of operations by resources or any other qualifier.',
          typeName: 'OperationTags',
        }),
      ),
      summary: optional(string({ typeComment: 'A short summary of what the operation does.' })),
      description: optional(
        string({
          typeComment:
            'A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      externalDocs: optional(externalDocs),
      operationId: optional(
        string({
          typeComment:
            'Unique string used to identify the operation. The id MUST be unique among all operations described in the API. The operationId value is case-sensitive.',
        }),
      ),
      parameters: optional(array(recursiveRef(lazy(() => parameter)), { typeName: 'OperationParameters' })),
      requestBody: optional(recursiveRef(lazy(() => requestBody))),
      responses: optional(lazy(() => responsesObject)),
      deprecated: optional(
        boolean({
          typeComment:
            'Declares this operation to be deprecated. Consumers SHOULD refrain from usage of the declared operation. Default value is false.',
        }),
      ),
      security: optional(array(securityRequirement, { typeName: 'OperationSecurity' })),
      servers: optional(array(server, { typeName: 'OperationServers' })),
      callbacks: optional(record(string(), recursiveRef(lazy(() => callback)), { typeName: 'OperationCallbacks' })),
    }),
    XBadges,
    XInternal,
    XScalarIgnore,
    XCodeSamples,
    XScalarStability,
    XScalarDisableParameters,
    XPostResponse,
    XPreRequest,
    XDraftExamples,
    XScalarSelectedServer,
  ],
  { typeName: 'OperationObject' },
)
