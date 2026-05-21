import { array, boolean, object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

export const XScalarCookie = object(
  {
    name: string({ typeComment: 'Cookie name' }),
    value: string({ typeComment: 'Cookie value' }),
    domain: optional(string({ typeComment: 'Domain scope (includes subdomains when set)' })),
    path: optional(string({ typeComment: 'Path scope — cookie is sent only for requests matching this path' })),
    isDisabled: optional(boolean({ typeComment: 'When true, the cookie is not sent with requests' })),
  },
  {
    typeName: 'XScalarCookie',
    typeComment: 'A persisted cookie definition for the workspace',
  },
)

export const XScalarCookies = object(
  {
    'x-scalar-cookies': optional(
      array(XScalarCookie, {
        typeComment: 'Cookies persisted for the workspace and injected into requests',
      }),
    ),
  },
  {
    typeName: 'XScalarCookies',
    typeComment: typeCommentWithExample('Persisted workspace cookies shared across requests.', {
      language: 'yaml',
      body: `x-scalar-cookies:
  - name: session
    value: abc123
    path: /`,
    }),
  },
)
