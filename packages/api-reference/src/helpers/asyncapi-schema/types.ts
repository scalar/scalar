/** Documentation nodes preserve native schema semantics without implying JSON validation rules. */
export type SchemaNode = {
  name: string
  type: string
  description?: string
  /** Display-only annotations; wording must not control schema structure. */
  details?: string[]
  /** Native field requiredness, independent of reader defaults. */
  required?: boolean
  /** Protobuf repeated fields project to arrays. */
  repeated?: boolean
  /** Stop expanding a reference to an ancestor definition. */
  recursive?: boolean
  /** Presence tracking for optional Protobuf fields. */
  presence?: 'explicit' | 'implicit'
  /** Avro enum symbols, including an explicitly empty symbol list. */
  symbols?: string[]
  /** Avro field fallback when reading data without this field; does not imply optional encoding. */
  readerDefault?: unknown
  children?: SchemaNode[]
  /** Keep a map value's native identity separate from its key type and field metadata. */
  mapValue?: SchemaNode
  mapKey?: string
  /** Real Protobuf oneof membership; synthetic proto3 optional groups are excluded. */
  oneofGroup?: string
  /** Protobuf wire tag, independent of the field name or declaration order. */
  fieldNumber?: number
}

/** A foreign schema can contain multiple named definitions, as in a Protobuf file. */
export type SchemaDocument = {
  nodes: SchemaNode[]
}

/** Bound expansion even for deeply nested or repeatedly referenced user schemas. */
export const createBudget = (): ((depth: number) => void) => {
  const remaining = { nodes: 2000 }
  return (depth): void => {
    if (depth > 40 || --remaining.nodes < 0) {
      throw new Error('Schema is too large to expand')
    }
  }
}
