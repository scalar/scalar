/**
 * Object that contain the license information as defined in
 * https://spec.openapis.org/oas/v3.0.3.html#contactObject
 */
export type ContactObject = {
  name?: string
  url?: string
  email?: string
}

/**
 * Object that contain the license information as defined in
 * https://spec.openapis.org/oas/v3.0.3.html#licenseObject
 */
export type LicenseObject = {
  name: string
  url?: string
}

/**
 * Object that contain the api information as defined in
 * https://spec.openapis.org/oas/v3.0.3.html#info-object
 */
export type InfoObject = {
  title?: string
  description?: string
  termsOfService?: string
  contact?: ContactObject
  license?: LicenseObject
  version?: string
}

/**
 * Object that contain the servers information as defined in
 * https://spec.openapis.org/oas/v3.0.3.html#server-object
 * field `variables`is not supported yet
 */
export type ServerObject = {
  url: string
  description?: string
}

/**
 * Object that contain the servers information as defined in
 * https://spec.openapis.org/oas/v3.0.3.html#security-scheme-object
 */
export type SecurityObject = {
  type: 'http'
  description?: string
  scheme: 'bearer' | 'basic'
  bearerFormat?: string
}

export type AuthOptions = {
  [key: string]: SecurityObject
}

/**
 * Object that contain the external docs information as defined in
 * https://spec.openapis.org/oas/v3.0.3.html#external-documentation-object
 */
export type ExternalDocsObject = {
  description?: string
  url?: string
}

export type FoldersOption = {
  concat: boolean
  separator: string
}

export type DisabledParamsOptions = {
  // Default to `false`
  includeQuery?: boolean
  // Default to `false`
  includeHeader?: boolean
}

export type Options = {
  info?: InfoObject
  defaultTag?: string
  pathDepth?: number
  auth?: AuthOptions
  servers?: Array<ServerObject>
  externalDocs?: ExternalDocsObject
  folders?: FoldersOption
  // Default value true
  responseHeaders?: boolean
  // Default value false
  replaceVars?: boolean
  additionalVars?: { [key: string]: string }
  // Default value 'yaml'
  outputFormat?: 'json' | 'yaml'
  disabledParams?: DisabledParamsOptions
  // Default value 'off'
  operationId?: 'off' | 'auto' | 'brackets'
}
