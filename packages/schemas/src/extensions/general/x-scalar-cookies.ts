import { array, boolean, object, optional, string } from '@scalar/validation'

export const XScalarCookie = object(
  {
    name: string({ typeComment: 'Defines the cookie name and its value.' }),
    value: string({ typeComment: 'Defines the cookie value.' }),
    domain: optional(string({ typeComment: 'Allows this domain and all subdomains.' })),
    path: optional(string({ typeComment: 'Restricts this cookie to requests that contain this path.' })),
    isDisabled: optional(boolean({ typeComment: 'Indicates if the cookie is disabled.' })),
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
        typeComment: 'Cookies persisted for the workspace',
      }),
    ),
  },
  {
    typeName: 'XScalarCookies',
    typeComment: 'Persisted workspace cookies',
  },
)
