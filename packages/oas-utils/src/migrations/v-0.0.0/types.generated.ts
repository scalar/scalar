export namespace v_0_0_0 {
  export type Collection = {
    uid: string
    spec: {
      openapi: string | '3.1.0' | '4.0.0'
      security: {
        [x: string]: string[]
      }[]
      info?:
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
      serverUids: string[]
      tags: {
        name: string
        description?: string | undefined
        externalDocs?:
          | {
              description?: string | undefined
              url: string
            }
          | undefined
      }[]
      externalDocs?:
        | {
            description?: string | undefined
            url: string
          }
        | undefined
    }
    securitySchemeDict: {
      [x: string]: string
    }
    selectedServerUid: string
    childUids: string[]
  }
  export type Cookie = {
    uid: string
    name: string
    value: string
    domain?: string | undefined
    expires?: Date | undefined
    httpOnly?: boolean | undefined
    maxAge?: number | undefined
    partitioned?: boolean | undefined
    path?: string | undefined
    sameSite: 'Lax' | 'Strict' | 'None'
    secure?: boolean | undefined
  }
  export type Environment = {
    uid: string
    name: string
    color: string
    raw: string
    parsed: {
      key: string
      value: string
    }[]
    isDefault?: boolean | undefined
  }
  export type Folder = {
    uid: string
    name: string
    description?: string | undefined
    childUids: string[]
  }
  export type RequestExample = {
    uid: string
    url: string
    requestUid: string
    name: string
    body: {
      raw: {
        encoding: 'json' | 'text' | 'html' | 'text' | 'javascript' | 'xml' | 'yaml' | 'edn'
        value: string
      }
      formData: {
        encoding: 'form-data' | 'urlencoded'
        value: {
          key: string
          value: string
          enabled: boolean
          file?:
            | {
                name: string
                lastModified: number
                webkitRelativePath: string
                size: number
                type: string
                arrayBuffer: (...args_0: unknown[]) => Promise<any>
                slice: (
                  args_0: number | undefined,
                  args_1: number | undefined,
                  args_2: string | undefined,
                  ...args_3: unknown[]
                ) => any
                stream: (...args_0: unknown[]) => any
                text: (...args_0: unknown[]) => Promise<string>
              }
            | undefined
          description?: string | undefined
          refUid?: string | undefined
          required?: boolean | undefined
          enum?: string[] | undefined
          type?: string | undefined
          format?: string | undefined
          minimum?: number | undefined
          maximum?: number | undefined
          default?: any | undefined
          nullable?: boolean | undefined
        }[]
      }
      binary?:
        | {
            name: string
            lastModified: number
            webkitRelativePath: string
            size: number
            type: string
            arrayBuffer: (...args_0: unknown[]) => Promise<any>
            slice: (
              args_0: number | undefined,
              args_1: number | undefined,
              args_2: string | undefined,
              ...args_3: unknown[]
            ) => any
            stream: (...args_0: unknown[]) => any
            text: (...args_0: unknown[]) => Promise<string>
          }
        | undefined
      activeBody: 'raw' | 'formData' | 'binary'
    }
    parameters: {
      path: {
        key: string
        value: string
        enabled: boolean
        file?:
          | {
              name: string
              lastModified: number
              webkitRelativePath: string
              size: number
              type: string
              arrayBuffer: (...args_0: unknown[]) => Promise<any>
              slice: (
                args_0: number | undefined,
                args_1: number | undefined,
                args_2: string | undefined,
                ...args_3: unknown[]
              ) => any
              stream: (...args_0: unknown[]) => any
              text: (...args_0: unknown[]) => Promise<string>
            }
          | undefined
        description?: string | undefined
        refUid?: string | undefined
        required?: boolean | undefined
        enum?: string[] | undefined
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
        file?:
          | {
              name: string
              lastModified: number
              webkitRelativePath: string
              size: number
              type: string
              arrayBuffer: (...args_0: unknown[]) => Promise<any>
              slice: (
                args_0: number | undefined,
                args_1: number | undefined,
                args_2: string | undefined,
                ...args_3: unknown[]
              ) => any
              stream: (...args_0: unknown[]) => any
              text: (...args_0: unknown[]) => Promise<string>
            }
          | undefined
        description?: string | undefined
        refUid?: string | undefined
        required?: boolean | undefined
        enum?: string[] | undefined
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
        file?:
          | {
              name: string
              lastModified: number
              webkitRelativePath: string
              size: number
              type: string
              arrayBuffer: (...args_0: unknown[]) => Promise<any>
              slice: (
                args_0: number | undefined,
                args_1: number | undefined,
                args_2: string | undefined,
                ...args_3: unknown[]
              ) => any
              stream: (...args_0: unknown[]) => any
              text: (...args_0: unknown[]) => Promise<string>
            }
          | undefined
        description?: string | undefined
        refUid?: string | undefined
        required?: boolean | undefined
        enum?: string[] | undefined
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
        file?:
          | {
              name: string
              lastModified: number
              webkitRelativePath: string
              size: number
              type: string
              arrayBuffer: (...args_0: unknown[]) => Promise<any>
              slice: (
                args_0: number | undefined,
                args_1: number | undefined,
                args_2: string | undefined,
                ...args_3: unknown[]
              ) => any
              stream: (...args_0: unknown[]) => any
              text: (...args_0: unknown[]) => Promise<string>
            }
          | undefined
        description?: string | undefined
        refUid?: string | undefined
        required?: boolean | undefined
        enum?: string[] | undefined
        type?: string | undefined
        format?: string | undefined
        minimum?: number | undefined
        maximum?: number | undefined
        default?: any | undefined
        nullable?: boolean | undefined
      }[]
    }
    auth: {
      [x: string]: any
    }
  }
  export type Request = {
    path: string
    method: 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE'
    uid: string
    ref: {
      path: string
      collectionRef?: string | undefined
      isExternal: boolean
    } | null
    tags?: string[] | undefined
    summary?: string | undefined
    description?: string | undefined
    operationId?: string | undefined
    parameters: {
      path: {
        [x: string]: any
      }
      query: {
        [x: string]: any
      }
      headers: {
        [x: string]: any
      }
      cookies: {
        [x: string]: any
      }
    }
    security?:
      | {
          [x: string]: string[]
        }[]
      | undefined
    securitySchemeUids: string[]
    selectedSecuritySchemeUids: string[]
    requestBody?: any | undefined
    childUids: string[]
    history: any[]
  }
  export type SecurityScheme =
    | {
        uid: string
        nameKey: string
        description?: string | undefined
        type: 'apiKey'
        name: string
        in: 'query' | 'header' | 'cookie'
        value: string
      }
    | {
        uid: string
        nameKey: string
        description?: string | undefined
        type: 'http'
        scheme: 'basic' | 'bearer'
        bearerFormat: 'JWT' | string
        value: string
        secondValue: string
      }
    | {
        uid: string
        nameKey: string
        description?: string | undefined
        type: 'oauth2'
        flow:
          | {
              refreshUrl: string
              scopes?:
                | (
                    | Map<string, string | undefined>
                    | {
                        [x: string]: string | undefined
                      }
                    | {}
                  )
                | undefined
              selectedScopes: string[]
              token: string
              type: 'implicit'
              authorizationUrl: string
              redirectUri: string
            }
          | {
              refreshUrl: string
              scopes?:
                | (
                    | Map<string, string | undefined>
                    | {
                        [x: string]: string | undefined
                      }
                    | {}
                  )
                | undefined
              selectedScopes: string[]
              token: string
              type: 'password'
              tokenUrl: string
              value: string
              secondValue: string
              clientSecret: string
            }
          | {
              refreshUrl: string
              scopes?:
                | (
                    | Map<string, string | undefined>
                    | {
                        [x: string]: string | undefined
                      }
                    | {}
                  )
                | undefined
              selectedScopes: string[]
              token: string
              type: 'clientCredentials'
              tokenUrl: string
              clientSecret: string
            }
          | {
              refreshUrl: string
              scopes?:
                | (
                    | Map<string, string | undefined>
                    | {
                        [x: string]: string | undefined
                      }
                    | {}
                  )
                | undefined
              selectedScopes: string[]
              token: string
              type: 'authorizationCode'
              authorizationUrl: string
              redirectUri: string
              tokenUrl: string
              clientSecret: string
            }
        clientId: string
      }
    | {
        uid: string
        nameKey: string
        description?: string | undefined
        type: 'openIdConnect'
        openIdConnectUrl: string
      }
  export type Server = {
    uid: string
    url: string
    description?: string | undefined
    variables?:
      | ({
          [x: string]: {
            uid: string
            enum?: string[] | undefined
            default: string
            description?: string | undefined
            value?: string | undefined
          }
        } | null)
      | undefined
  }
  export type Workspace = {
    uid: string
    name: string
    description: string
    isReadOnly: boolean
    collectionUids: string[]
    environmentUids: string[]
    hotKeyConfig?:
      | {
          modifiers: ('Meta' | 'Control' | 'Shift' | 'Alt' | 'default')[]
          hotKeys?:
            | {
                [x: string]: {
                  modifiers?: ('Meta' | 'Control' | 'Shift' | 'Alt' | 'default')[] | undefined
                  event:
                    | 'closeModal'
                    | 'navigateSearchResultsDown'
                    | 'selectSearchResult'
                    | 'navigateSearchResultsUp'
                    | 'openCommandPalette'
                    | 'toggleSidebar'
                    | 'addTopNav'
                    | 'closeTopNav'
                    | 'navigateTopNavLeft'
                    | 'navigateTopNavRight'
                    | 'focusAddressBar'
                    | 'jumpToTab'
                    | 'jumpToLastTab'
                    | 'focusRequestSearch'
                }
              }
            | undefined
        }
      | undefined
    activeEnvironmentId: string
    cookieUids: string[]
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
      | 'mars'
      | 'none'
  }
  export type DataRecord = {
    collections: Record<string, Collection>
    cookies: Record<string, Cookie>
    environments: Record<string, Environment>
    folders: Record<string, Folder>
    requestExamples: Record<string, RequestExample>
    requests: Record<string, Request>
    securitySchemes: Record<string, SecurityScheme>
    servers: Record<string, Server>
    workspaces: Record<string, Workspace>
  }
}
