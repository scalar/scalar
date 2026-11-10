import type {
  EnumDefinition,
  FieldDefinition,
  MessageDefinition,
  NamespaceDefinition,
  OneofDefinition,
  ProtoRoot,
  ServiceDefinition,
} from 'proto-parser'

/** Nodes that can participate in lexical Protobuf name resolution. */
export type Definition =
  | ProtoRoot
  | NamespaceDefinition
  | MessageDefinition
  | EnumDefinition
  | ServiceDefinition
  | FieldDefinition
  | OneofDefinition

/** Narrow the parser AST without depending on its internal reflection classes. */
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
