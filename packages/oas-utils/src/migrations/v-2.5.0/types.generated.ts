import type { XScalarStability } from '@scalar/types/legacy'

import type { HotkeyEventName, KeydownKey } from '@/entities/hotkeys/hotkeys'

type Collection = {
  'type': 'collection'
  'openapi': string | '3.0.0' | '3.1.0' | '4.0.0'
  'jsonSchemaDialect'?: string | undefined
  'info': {
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
          name?: string | null | undefined
          identifier?: string | undefined
          url?: string | undefined
        }
      | undefined
    version: string
    'x-scalar-sdk-installation'?:
      | {
          lang: string
          source?: string | undefined
          description?: string | undefined
        }[]
      | undefined
  }
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
  'selectedServerUid'?: string | undefined
  'servers': string[]
  'requests': string[]
  'tags': string[]
  'children': string[]
  'documentUrl'?: string | undefined
  'watchMode': boolean
  'integration'?: (string | null) | undefined
  'useCollectionSecurity': boolean
  'watchModeStatus': 'IDLE' | 'WATCHING' | 'ERROR'
}

type Cookie = {
  uid: string
  name: string
  value: string
  domain?: string | undefined
  path?: string | undefined
}

type Environment = {
  uid: string
  name: string
  color: string
  value: string
  isDefault?: boolean | undefined
}

type Tag = {
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

type RequestExample = {
  uid: string
  type: 'requestExample'
  requestUid?: string | undefined
  name: string
  body: {
    raw?:
      | {
          encoding: 'json' | 'text' | 'html' | 'javascript' | 'xml' | 'yaml' | 'edn'
          value: string
          mimeType?: string | undefined
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
            examples?: any[] | undefined
            type?: (string | string[]) | undefined
            format?: string | undefined
            minimum?: number | undefined
            maximum?: number | undefined
            default?: any | undefined
            nullable?: boolean | undefined
          }[]
        }
      | undefined
    binary?: Blob | undefined
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
      examples?: any[] | undefined
      type?: (string | string[]) | undefined
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
      examples?: any[] | undefined
      type?: (string | string[]) | undefined
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
      examples?: any[] | undefined
      type?: (string | string[]) | undefined
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
      examples?: any[] | undefined
      type?: (string | string[]) | undefined
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

type Request = {
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
        style?: ('matrix' | 'simple' | 'form' | 'label' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject') | undefined
        explode?: boolean | undefined
        example?: unknown | undefined
        examples?:
          | {
              [x: string]: {
                value?: unknown
                summary?: string | undefined
                externalValue?: string | undefined
              }
            }
          | unknown[]
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
  'callbacks'?:
    | {
        [x: string]: {
          [x: string]: {
            [x: string]: any
          }
        }
      }
    | undefined
  'x-codeSamples'?:
    | {
        lang?: string | undefined
        label?: string | undefined
        source: string
      }[]
    | undefined
  'x-code-samples'?:
    | {
        lang?: string | undefined
        label?: string | undefined
        source: string
      }[]
    | undefined
  'x-custom-examples'?:
    | {
        lang?: string | undefined
        label?: string | undefined
        source: string
      }[]
    | undefined
  'x-internal'?: boolean | undefined
  'x-scalar-ignore'?: boolean | undefined
  'x-scalar-stability'?: XScalarStability | undefined
  'type': 'request'
  'uid': string
  'path': string
  'method': 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace'
  'servers': string[]
  'selectedServerUid': string | null
  'examples': string[]
  'selectedSecuritySchemeUids': (string | string[])[]
  'x-post-response'?: string | undefined
}

type SecurityScheme =
  | {
      description?: string | undefined
      type: 'apiKey'
      name: string
      in: 'query' | 'header' | 'cookie'
      uid: string
      nameKey: string
      value: string
    }
  | {
      description?: string | undefined
      type: 'http'
      scheme: any
      bearerFormat: 'JWT' | string
      uid: string
      nameKey: string
      username: string
      password: string
      token: string
    }
  | {
      description?: string | undefined
      type: 'openIdConnect'
      openIdConnectUrl: string
      uid: string
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
      uid: string
      nameKey: string
    }

type Server = {
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
  uid: string
}

type Workspace = {
  uid: string
  name: string
  description: string
  collections: string[]
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
  cookies: string[]
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

type DataRecord = {
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

export type v_2_5_0 = {
  Collection: Collection
  Cookie: Cookie
  Environment: Environment
  Tag: Tag
  RequestExample: RequestExample
  Request: Request
  SecurityScheme: SecurityScheme
  Server: Server
  Workspace: Workspace
  DataRecord: DataRecord
}
