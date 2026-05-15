/** UID format for objects */
export type Nanoid = string

/** All of our entity brands (legacy; UIDs are plain strings in the type layer) */
export type ENTITY_BRANDS = {
  COLLECTION: 'collection'
  COOKIE: 'cookie'
  ENVIRONMENT: 'environment'
  EXAMPLE: 'example'
  OPERATION: 'operation'
  SECURITY_SCHEME: 'securityScheme'
  SERVER: 'server'
  TAG: 'tag'
  WORKSPACE: 'workspace'
}
