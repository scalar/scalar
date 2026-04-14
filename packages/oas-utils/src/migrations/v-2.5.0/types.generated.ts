/** biome-ignore-all lint/style/noNamespace: <explanation> */

import type { AssertNoDiff, MismatchPathDiff } from '@scalar/helpers/types/assertions'
import type { SecurityScheme } from '@scalar/types/entities'

import type { Cookie } from '@/entities/cookie/cookie'
import type { Environment } from '@/entities/environment/environment'
import type { HotkeyEventName, KeydownKey } from '@/entities/hotkeys/hotkeys'
import type { Collection } from '@/entities/spec/collection'
import type { RequestExample } from '@/entities/spec/request-examples'
import type { Request } from '@/entities/spec/requests'
import type { Server } from '@/entities/spec/server'
import type { Tag } from '@/entities/spec/spec-objects'
import type { Workspace } from '@/entities/workspace/workspace'

export type v_2_5_0 = {
  Cookie: Cookie
  Environment: Environment
  Collection: Collection
  Request: Request
  RequestExample: RequestExample
  SecurityScheme: SecurityScheme
  Server: Server
  Tag: Tag
  Workspace: Workspace

  DataRecord: {
    collections: Record<string, Collection>
    cookies: Record<string, Cookie>
    environments: Record<string, Environment>
    requestExamples: Record<string, RequestExample>
    requests: Record<string, Request>
    securitySchemes: Record<string, SecurityScheme>
    servers: Record<string, Server>
    tags: Record<string, Tag>
    workspaces: Record<string, Workspace>
  }

  DataArray: {
    collections: Collection[]
    cookies: Cookie[]
    environments: Environment[]
    requestExamples: RequestExample[]
    requests: Request[]
    securitySchemes: SecurityScheme[]
    servers: Server[]
    tags: Tag[]
    workspaces: Workspace[]
  }
}

export namespace v_2_5_0_N {
  export type Collection = {
    'type': 'collection'
    'openapi': string | '3.0.0' | '3.1.0' | '4.0.0'
    'jsonSchemaDialect'?: string | undefined
    'info'?:
      | {
          title: string
          summary?: string | undefined
          description?: string | undefined
          termsOfService?: string | undefined
          contact?:
            | {
                name?: string | undefined
                url?: string | undefined
                email?: string | undefined
              }
            | undefined
          license?:
            | {
                name: string
                identifier?: string | undefined
                url?: string | undefined
              }
            | undefined
          version: string
        }
      | undefined
    'security': {
      [x: string]: string[]
    }[]
    'externalDocs'?:
      | {
          description?: string | undefined
          url: string
        }
      | undefined
    'components'?:
      | {
          [x: string]: unknown
        }
      | undefined
    'webhooks'?:
      | {
          [x: string]: unknown
        }
      | undefined
    'x-scalar-icon': string
    'x-scalar-active-environment'?: string | undefined
    'x-scalar-environments'?:
      | {
          [x: string]: {
            description?: string | undefined
            color?: string | undefined
            variables: {
              [x: string]:
                | {
                    description?: string | undefined
                    default: string
                  }
                | string
            }
          }
        }
      | undefined
    'x-scalar-secrets'?:
      | {
          [x: string]: {
            description?: string | undefined
            example?: string | undefined
          }
        }
      | undefined
    'uid': string
    'securitySchemes': string[]
    'selectedSecuritySchemeUids': string[]
    'selectedServerUid': string
    'servers': string[]
    'requests': string[]
    'tags': string[]
    'children': string[]
    'documentUrl'?: string | undefined
    'watchMode': boolean
    'integration'?: (string | null) | undefined
    'watchModeStatus': 'IDLE' | 'WATCHING' | 'ERROR'
  }

  export type Cookie = {
    uid: string
    name: string
    value: string
    domain?: string | undefined
    path?: string | undefined
  }

  export type Environment = {
    uid: string
    name: string
    color: string
    value: string
    isDefault?: boolean | undefined
  }

  export type Tag = {
    'type': 'tag'
    'name': string
    'description'?: string | undefined
    'externalDocs'?:
      | {
          description?: string | undefined
          url: string
        }
      | undefined
    'x-scalar-children'?:
      | {
          tagName: string
        }[]
      | undefined
    'x-internal'?: boolean | undefined
    'x-scalar-ignore'?: boolean | undefined
    'uid': string
    'children': string[]
  }

  export type RequestExample = {
    uid: string
    type: 'requestExample'
    requestUid: string
    name: string
    body: {
      raw?:
        | {
            encoding: 'json' | 'text' | 'html' | 'javascript' | 'xml' | 'yaml' | 'edn'
            value: string
          }
        | undefined
      formData?:
        | {
            encoding: 'form-data' | 'urlencoded'
            value: {
              key: string
              value: string
              enabled: boolean
              file?: any | undefined
              description?: string | undefined
              required?: boolean | undefined
              enum?: string[] | undefined
              examples?: string[] | undefined
              type?: string | undefined
              format?: string | undefined
              minimum?: number | undefined
              maximum?: number | undefined
              default?: any | undefined
              nullable?: boolean | undefined
            }[]
          }
        | undefined
      binary?: any | undefined
      activeBody: 'raw' | 'formData' | 'binary'
    }
    parameters: {
      path: {
        key: string
        value: string
        enabled: boolean
        file?: any | undefined
        description?: string | undefined
        required?: boolean | undefined
        enum?: string[] | undefined
        examples?: string[] | undefined
        type?: string | undefined
        format?: string | undefined
        minimum?: number | undefined
        maximum?: number | undefined
        default?: any | undefined
        nullable?: boolean | undefined
      }[]
      query: {
        key: string
        value: string
        enabled: boolean
        file?: any | undefined
        description?: string | undefined
        required?: boolean | undefined
        enum?: string[] | undefined
        examples?: string[] | undefined
        type?: string | undefined
        format?: string | undefined
        minimum?: number | undefined
        maximum?: number | undefined
        default?: any | undefined
        nullable?: boolean | undefined
      }[]
      headers: {
        key: string
        value: string
        enabled: boolean
        file?: any | undefined
        description?: string | undefined
        required?: boolean | undefined
        enum?: string[] | undefined
        examples?: string[] | undefined
        type?: string | undefined
        format?: string | undefined
        minimum?: number | undefined
        maximum?: number | undefined
        default?: any | undefined
        nullable?: boolean | undefined
      }[]
      cookies: {
        key: string
        value: string
        enabled: boolean
        file?: any | undefined
        description?: string | undefined
        required?: boolean | undefined
        enum?: string[] | undefined
        examples?: string[] | undefined
        type?: string | undefined
        format?: string | undefined
        minimum?: number | undefined
        maximum?: number | undefined
        default?: any | undefined
        nullable?: boolean | undefined
      }[]
    }
    serverVariables?:
      | {
          [x: string]: string[]
        }
      | undefined
  }

  export type Request = {
    'tags'?: string[] | undefined
    'summary'?: string | undefined
    'description'?: string | undefined
    'operationId'?: string | undefined
    'security'?:
      | {
          [x: string]: string[]
        }[]
      | undefined
    'requestBody'?: any | undefined
    'parameters'?:
      | {
          in: 'path' | 'query' | 'header' | 'cookie'
          name: string
          description?: string | undefined
          required: boolean
          deprecated: boolean
          schema?: unknown | undefined
          content?: unknown | undefined
          style?:
            | ('matrix' | 'simple' | 'form' | 'label' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject')
            | undefined
          example?: unknown | undefined
          examples?:
            | {
                [x: string]: {
                  value?: unknown
                  summary?: string | undefined
                }
              }
            | undefined
        }[]
      | undefined
    'externalDocs'?:
      | {
          description?: string | undefined
          url: string
        }
      | undefined
    'deprecated'?: boolean | undefined
    'responses'?:
      | {
          [x: string]: any
        }
      | undefined
    'x-internal'?: boolean | undefined
    'x-scalar-ignore'?: boolean | undefined
    'type': 'request'
    'uid': v_2_5_0['Request']['uid']
    'path': string
    'method': 'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace'
    'servers': v_2_5_0['Server']['uid'][]
    'selectedServerUid': v_2_5_0['Server']['uid'][]
    'examples': v_2_5_0['RequestExample']['uid'][]
    'selectedSecuritySchemeUids': v_2_5_0['SecurityScheme']['uid'][]
  }

  export type SecurityScheme =
    | {
        description?: string | undefined
        type: 'apiKey'
        name: string
        in: 'query' | 'header' | 'cookie'
        uid: v_2_5_0['SecurityScheme']['uid']
        nameKey: string
        value: string
      }
    | {
        description?: string | undefined
        type: 'http'
        scheme: any
        bearerFormat: 'JWT' | string
        uid: v_2_5_0['SecurityScheme']['uid']
        nameKey: string
        username: string
        password: string
        token: string
      }
    | {
        description?: string | undefined
        type: 'openIdConnect'
        openIdConnectUrl: string
        uid: v_2_5_0['SecurityScheme']['uid']
        nameKey: string
      }
    | {
        description?: string | undefined
        type: 'oauth2'
        flows: {
          implicit?:
            | {
                'refreshUrl': string
                'scopes': {
                  [x: string]: string
                }
                'selectedScopes': string[]
                'x-scalar-client-id': string
                'token': string
                'type': 'implicit'
                'authorizationUrl': string
                'x-scalar-redirect-uri': string
              }
            | undefined
          password?:
            | {
                'refreshUrl': string
                'scopes': {
                  [x: string]: string
                }
                'selectedScopes': string[]
                'x-scalar-client-id': string
                'token': string
                'type': 'password'
                'tokenUrl': string
                'clientSecret': string
                'username': string
                'password': string
              }
            | undefined
          clientCredentials?:
            | {
                'refreshUrl': string
                'scopes': {
                  [x: string]: string
                }
                'selectedScopes': string[]
                'x-scalar-client-id': string
                'token': string
                'type': 'clientCredentials'
                'tokenUrl': string
                'clientSecret': string
              }
            | undefined
          authorizationCode?:
            | {
                'refreshUrl': string
                'scopes': {
                  [x: string]: string
                }
                'selectedScopes': string[]
                'x-scalar-client-id': string
                'token': string
                'type': 'authorizationCode'
                'authorizationUrl': string
                'x-usePkce': 'SHA-256' | 'plain' | 'no'
                'x-scalar-redirect-uri': string
                'tokenUrl': string
                'clientSecret': string
              }
            | undefined
        }
        uid: v_2_5_0['SecurityScheme']['uid']
        nameKey: string
      }

  export type Server = {
    url: string
    description?: string | undefined
    variables?:
      | {
          [x: string]: {
            enum?: string[] | undefined
            default?: string | undefined
            description?: string | undefined
            value?: string | undefined
          }
        }
      | undefined
    uid: v_2_5_0['Server']['uid']
  }

  export type Workspace = {
    uid: v_2_5_0['Workspace']['uid']
    name: string
    description: string
    collections: v_2_5_0['Collection']['uid'][]
    environments: {
      [x: string]: string
    }
    hotKeyConfig?:
      | {
          modifiers: ('Meta' | 'Control' | 'Shift' | 'Alt' | 'default')[]
          hotKeys?:
            | Partial<
                Record<
                  KeydownKey,
                  {
                    modifiers?: ('Meta' | 'Control' | 'Shift' | 'Alt' | 'default')[] | undefined
                    event: HotkeyEventName
                  }
                >
              >
            | undefined
        }
      | undefined
    activeEnvironmentId: string
    cookies: v_2_5_0['Cookie']['uid'][]
    proxyUrl?: string | undefined
    themeId:
      | 'alternate'
      | 'default'
      | 'moon'
      | 'purple'
      | 'solarized'
      | 'bluePlanet'
      | 'deepSpace'
      | 'saturn'
      | 'kepler'
      | 'elysiajs'
      | 'fastify'
      | 'mars'
      | 'none'
      | 'laserwave'
    selectedHttpClient: {
      targetKey: string
      clientKey: string
    }
  }

  export type DataRecord = {
    collections: Record<string, Collection>
    cookies: Record<string, Cookie>
    environments: Record<string, Environment>
    requestExamples: Record<string, RequestExample>
    requests: Record<string, Request>
    securitySchemes: Record<string, SecurityScheme>
    servers: Record<string, Server>
    tags: Record<string, Tag>
    workspaces: Record<string, Workspace>
  }
}

// export type TestCollection = AssertNoDiff<MismatchPathDiff<v_2_5_0_N.Collection, v_2_5_0['Collection']>>
// export type TestCookie = AssertNoDiff<MismatchPathDiff<v_2_5_0_N.Cookie, v_2_5_0['Cookie']>>
// export type TestEnvironment = AssertNoDiff<MismatchPathDiff<v_2_5_0_N.Environment, v_2_5_0['Environment']>>
// export type TestTag = AssertNoDiff<MismatchPathDiff<v_2_5_0_N.Tag, v_2_5_0['Tag']>>
// export type TestRequestExample = AssertNoDiff<MismatchPathDiff<v_2_5_0_N.RequestExample, v_2_5_0['RequestExample']>>
export type TestRequest = AssertNoDiff<MismatchPathDiff<v_2_5_0_N.Request, v_2_5_0['Request']>>
export type TestSecurityScheme = AssertNoDiff<MismatchPathDiff<v_2_5_0_N.SecurityScheme, v_2_5_0['SecurityScheme']>>
export type TestServer = AssertNoDiff<MismatchPathDiff<v_2_5_0_N.Server, v_2_5_0['Server']>>
export type TestWorkspace = AssertNoDiff<MismatchPathDiff<v_2_5_0_N.Workspace, v_2_5_0['Workspace']>>
