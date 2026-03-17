/** Minimal JSON Schema 7 type for our purposes */
export type JsonSchema = {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  enum?: (string | number | boolean | null)[]
  default?: unknown
  description?: string
  items?: JsonSchema
  anyOf?: JsonSchema[]
  oneOf?: JsonSchema[]
  allOf?: JsonSchema[]
  const?: unknown
  nullable?: boolean
  $ref?: string
  additionalProperties?: boolean | JsonSchema
}

export type SchemaMap = Record<string, JsonSchema>
