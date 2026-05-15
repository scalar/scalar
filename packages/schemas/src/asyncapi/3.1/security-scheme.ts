import { array, object, optional, string, union } from '@scalar/validation'

import { asyncApiOAuthFlowsObject } from './oauth'
import { asyncApiReferenceObject, normalRef } from './reference'

export const asyncApiSecuritySchemeObject = union(
  [
    asyncApiReferenceObject,
    object(
      {
        type: string({
          typeComment:
            'REQUIRED. Security scheme type: userPassword, apiKey, X509, symmetricEncryption, asymmetricEncryption, httpApiKey, http, oauth2, openIdConnect, plain, scramSha256, scramSha512, gssapi.',
        }),
        description: optional(
          string({
            typeComment:
              'A short description for security scheme. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        name: optional(
          string({ typeComment: 'REQUIRED for httpApiKey. The name of the header, query or cookie parameter.' }),
        ),
        'in': optional(
          string({
            typeComment:
              'REQUIRED for apiKey and httpApiKey. Location of the API key: user, password, query, header, or cookie.',
          }),
        ),
        scheme: optional(
          string({
            typeComment:
              'REQUIRED for http. The name of the HTTP Authorization scheme to be used in the Authorization header.',
          }),
        ),
        bearerFormat: optional(
          string({ typeComment: 'A hint to the client to identify how the bearer token is formatted.' }),
        ),
        flows: optional(normalRef(asyncApiOAuthFlowsObject)),
        openIdConnectUrl: optional(
          string({
            typeComment:
              'REQUIRED for openIdConnect. OpenId Connect URL to discover OAuth2 configuration values (absolute URL).',
          }),
        ),
        scopes: optional(
          array(string(), { typeComment: 'List of the needed scope names for oauth2 and openIdConnect.' }),
        ),
      },
      { typeName: 'AsyncApiSecuritySchemeObject' },
    ),
  ],
  { typeName: 'AsyncApiSecuritySchemeOrReference' },
)
