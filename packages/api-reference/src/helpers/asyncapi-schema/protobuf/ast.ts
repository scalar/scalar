/** Highest legal field number before the reserved implementation range is considered. */
export const fieldMax = 536870911

/** Highest legal signed enum value. */
export const enumMax = 2147483647

type Node<Kind> = {
  syntaxType: Kind
  name: string
  fullName?: string
  comment?: string
  options?: Record<string, unknown>
}

/** Inclusive ranges and names reserved by a message or enum. */
export type Reservation = string | [number, number]

/** A Protobuf field, before Scalar resolves its type across files. */
export type FieldDefinition = Node<'FieldDefinition'> & {
  id: number
  type: { value: string }
  rule?: 'optional' | 'required' | 'repeated'
  repeated?: boolean
  keyType?: { value: string }
  map?: boolean
}

/** A named set of sibling fields with mutually exclusive presence. */
export type OneofDefinition = Node<'OneofDefinition'> & { oneof: string[] }

/** A declared message with its own field and type scope. */
export type MessageDefinition = Node<'MessageDefinition'> & {
  fields: Record<string, FieldDefinition>
  nested: { [name: string]: Definition }
  oneofs: Record<string, OneofDefinition>
  reserved: Reservation[]
}

/** A declared enum with values and their source metadata. */
export type EnumDefinition = Node<'EnumDefinition'> & {
  values: Record<string, number>
  comments: Record<string, string | undefined>
  valuesOptions: Record<string, Record<string, unknown>>
  reserved: Reservation[]
}

/** A package namespace or the root scope of one parsed file. */
export type Scope = Node<'ProtoRoot' | 'NamespaceDefinition'> & {
  nested: { [name: string]: Definition }
}

/** Nodes that can participate in lexical Protobuf name resolution. */
export type Definition = Scope | MessageDefinition | EnumDefinition | FieldDefinition | OneofDefinition

/** Narrow the schema model to a message. */
export const isMessage = (node: Definition | null): node is MessageDefinition =>
  node?.syntaxType === 'MessageDefinition'

/** Enum values have their own validation rules and share the enclosing namespace. */
export const isEnum = (node: Definition | null): node is EnumDefinition => node?.syntaxType === 'EnumDefinition'

/** Native scalar names do not take part in lexical message/enum lookup. */
export const isScalar = (name: string): boolean =>
  [
    'double',
    'float',
    'int32',
    'int64',
    'uint32',
    'uint64',
    'sint32',
    'sint64',
    'fixed32',
    'fixed64',
    'sfixed32',
    'sfixed64',
    'bool',
    'string',
    'bytes',
  ].includes(name)
