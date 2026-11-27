import type {
  Comma,
  Constant,
  Enum,
  Field,
  FieldOption,
  FieldOptions,
  MapField,
  Message,
  Oneof,
  OneofField,
  Option,
  Range,
  Reserved,
  SignedIntLit,
  StatementBase,
  StrLit,
  TextprotoMessageStatement,
} from 'pbkit/core/ast/index.js'
import { parse } from 'pbkit/core/parser/proto.js'

import {
  type EnumDefinition,
  type FieldDefinition,
  type MessageDefinition,
  type Reservation,
  type Scope,
  fieldMax,
  int32Max,
  isScalar,
} from './ast'

type Syntax = 'proto2' | 'proto3'
type Options = Record<string, unknown>

/** Syntax and type scope of one file before imports are resolved. */
export type ProtoDocument = { syntax: Syntax; root: Scope; importCount: number }

const insert = <Value>(entries: Record<string, Value>, key: string, value: Value): void => {
  if (Object.hasOwn(entries, key)) throw new Error('Duplicate Protobuf declaration')
  entries[key] = value
}

const qualifiedName = ({ identOrDots }: { identOrDots: { text: string }[] }): string =>
  identOrDots.map(({ text }) => text).join('')

const integer = (text: string): number => (/^0[0-7]+$/.test(text) ? Number.parseInt(text, 8) : Number(text))

const numericSign = (sign: SignedIntLit['sign']): number => {
  if (sign?.text === '+') {
    throw new Error('Unexpected plus sign in Protobuf numeric value')
  }
  return sign?.text === '-' ? -1 : 1
}

const signedInteger = ({ sign, value }: SignedIntLit): number => numericSign(sign) * integer(value.text)

const escapeCharacters: Record<string, string> = {
  a: '\x07',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
}

const stringLiteral = ({ tokens }: StrLit): string =>
  tokens
    .map(({ text }) =>
      text
        .slice(1, -1)
        .replace(/\\(u[\da-fA-F]{4}|U[\da-fA-F]{8}|[xX][\da-fA-F]{1,2}|[0-7]{1,3}|.)/g, (_match, escape: string) => {
          if (escape[0] === 'u' || escape[0] === 'U') return String.fromCodePoint(Number.parseInt(escape.slice(1), 16))
          if (escape[0]?.toLowerCase() === 'x') return String.fromCharCode(Number.parseInt(escape.slice(1), 16))
          if (/^[0-7]/.test(escape)) return String.fromCharCode(Number.parseInt(escape, 8) % 256)
          return escapeCharacters[escape] ?? escape
        }),
    )
    .join('')

const fullIdentifier = /^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/

const floatValue = (text: string): number => (text.toLowerCase() === 'inf' ? Number.POSITIVE_INFINITY : Number(text))

const constantValue = (constant: Constant, scalarDefault: boolean): string | number | boolean => {
  switch (constant.type) {
    case 'bool-lit':
      return constant.text.toLowerCase() === 'true'
    case 'full-ident': {
      const name = qualifiedName(constant)
      if (!fullIdentifier.test(name.startsWith('.') ? name.slice(1) : name)) {
        throw new Error('Malformed Protobuf option value')
      }
      if (scalarDefault && /^(?:inf|nan)$/i.test(name)) return floatValue(name)
      return name
    }
    case 'signed-int-lit':
      return signedInteger(constant)
    case 'signed-float-lit':
      return numericSign(constant.sign) * floatValue(constant.value.text)
    case 'str-lit':
      return stringLiteral(constant)
    case 'aggregate':
      throw new Error('Unsupported aggregate Protobuf option')
  }
}

const commaItems = <Item extends FieldOption | Range | StrLit>(tokens: (Item | Comma)[]): Item[] => {
  // pbkit's editor parser can return partial lists. Scalar renders only complete definitions.
  if (tokens.length % 2 === 0 || tokens.some((token, index) => (token.type === 'comma') !== (index % 2 === 1))) {
    throw new Error('Malformed Protobuf list')
  }
  return tokens.filter((token): token is Item => token.type !== 'comma')
}

const validateAggregate = (statements: TextprotoMessageStatement[]): void => {
  let canSeparate = false
  for (const statement of statements) {
    if (statement.type === 'textproto-comma' && canSeparate) {
      canSeparate = false
      continue
    }
    if (statement.type !== 'textproto-field' || statement.fieldName.type !== 'textproto-ident') {
      throw new Error('Malformed Protobuf aggregate option')
    }
    const { value, colon, semiOrComma } = statement
    if (
      semiOrComma?.type === 'textproto-semi' ||
      value.type === 'textproto-list-value' ||
      (value.type === 'textproto-signed-ident' && value.sign && !/^(?:inf(?:inity)?|nan)$/i.test(value.value.text)) ||
      (value.type === 'textproto-message-value' ? value.bracketOpen.text !== '{' : !colon)
    ) {
      throw new Error('Unsupported Protobuf aggregate option')
    }
    if (value.type === 'textproto-message-value') validateAggregate(value.statements)
    canSeparate = !semiOrComma
  }
}

const addOption = (
  options: Options,
  { optionName, constant }: FieldOption | Option,
  scope: 'file' | 'declaration' = 'declaration',
  scalarField = false,
): void => {
  const name = optionName.optionNameSegmentOrDots
    .map((segment, index) => {
      if ((segment.type === 'dot') !== (index % 2 === 1)) throw new Error('Malformed Protobuf option name')
      if (segment.type === 'dot') return '.'
      if (segment.bracketOpen || segment.bracketClose) throw new Error('Unsupported custom Protobuf option')
      return qualifiedName(segment.name)
    })
    .join('')
  if (!fullIdentifier.test(name)) throw new Error('Malformed Protobuf option name')
  // Structured file metadata does not affect the schema view.
  if (scope === 'file' && constant.type === 'aggregate') {
    validateAggregate(constant.statements)
    return
  }
  insert<unknown>(options, name, constantValue(constant, scalarField && name === 'default'))
}

const fieldOptions = (node: FieldOptions | undefined, scalarField = false): Options => {
  const options: Options = Object.create(null)
  if (node) {
    for (const item of commaItems(node.fieldOptionOrCommas)) addOption(options, item, 'declaration', scalarField)
  }
  return options
}

const description = ({ leadingComments, trailingComments }: StatementBase): string | undefined => {
  const group = leadingComments.at(-1) ?? trailingComments[0]
  return (
    group?.comments
      .map(({ text, type }) =>
        type === 'singleline-comment'
          ? text.replace(/^\/\/\/? ?/, '').trimEnd()
          : text
              .slice(2, -2)
              .split('\n')
              .map((line) => line.trim().replace(/^\*+\s*/, ''))
              .join('\n'),
      )
      .join('\n')
      .trim() || undefined
  )
}

const reservations = ({ reserved }: Reserved, maximum: number): Reservation[] => {
  const result: Reservation[] = []
  if (reserved.type === 'field-names') {
    for (const name of commaItems(reserved.strLitOrCommas)) {
      if (name.tokens.length !== 1) throw new Error('Malformed Protobuf reserved name')
      result.push(stringLiteral(name))
    }
  } else {
    for (const range of commaItems(reserved.rangeOrCommas)) {
      const start = signedInteger(range.rangeStart)
      const end = range.rangeEnd
      result.push([start, end?.type === 'max' ? maximum : end ? signedInteger(end) : start])
    }
  }
  return result
}

const readField = (field: Field | MapField | OneofField, syntax: Syntax): FieldDefinition => {
  const rule = field.type === 'field' ? field.fieldLabel?.text : undefined
  if (rule !== undefined && rule !== 'required' && rule !== 'optional' && rule !== 'repeated') {
    throw new Error('Invalid Protobuf field label')
  }
  if (field.type === 'field' && syntax === 'proto2' && !rule) throw new Error('Missing proto2 field label')
  const map = field.type === 'map-field'
  const key = map ? qualifiedName(field.keyType) : undefined
  if (key !== undefined && (!isScalar(key) || ['bytes', 'double', 'float'].includes(key))) {
    throw new Error('Invalid Protobuf map key')
  }
  const type = qualifiedName(map ? field.valueType : field.fieldType)
  return {
    syntaxType: 'FieldDefinition',
    name: map ? field.mapName.text : field.fieldName.text,
    id: integer(field.fieldNumber.text),
    type: { value: type },
    rule,
    ...(key === undefined ? {} : { keyType: { value: key } }),
    options: fieldOptions(field.fieldOptions, isScalar(type)),
    comment: description(field),
  }
}

const readEnum = (node: Enum): EnumDefinition => {
  const options: Options = Object.create(null)
  const definition: EnumDefinition = {
    syntaxType: 'EnumDefinition',
    name: node.enumName.text,
    comment: description(node),
    options,
    values: Object.create(null),
    comments: Object.create(null),
    valuesOptions: Object.create(null),
    reserved: [],
  }
  for (const statement of node.enumBody.statements) {
    switch (statement.type) {
      case 'option':
        addOption(options, statement)
        break
      case 'reserved':
        definition.reserved.push(...reservations(statement, int32Max))
        break
      case 'enum-field': {
        const name = statement.fieldName.text
        insert(definition.values, name, signedInteger(statement.fieldNumber))
        definition.comments[name] = description(statement)
        definition.valuesOptions[name] = fieldOptions(statement.fieldOptions)
        break
      }
    }
  }
  return definition
}

const addOneof = (
  message: MessageDefinition,
  node: Oneof,
  syntax: Syntax,
  addField: (field: FieldDefinition) => void,
): void => {
  const options: Options = Object.create(null)
  const oneof: string[] = []
  for (const statement of node.oneofBody.statements) {
    if (statement.type === 'oneof-field') {
      const field = readField(statement, syntax)
      addField(field)
      oneof.push(field.name)
    } else if (statement.type === 'option') {
      addOption(options, statement)
    } else if (statement.type !== 'empty') {
      throw new Error('Unsupported Protobuf oneof declaration')
    }
  }
  const name = node.oneofName.text
  insert(message.oneofs, name, { syntaxType: 'OneofDefinition', name, oneof, options })
}

const readMessage = (node: Message, syntax: Syntax, depth: number): MessageDefinition => {
  if (depth > 40) throw new Error('Protobuf is too large')
  const options: Options = Object.create(null)
  const definition: MessageDefinition = {
    syntaxType: 'MessageDefinition',
    name: node.messageName.text,
    comment: description(node),
    options,
    fields: Object.create(null),
    nested: Object.create(null),
    oneofs: Object.create(null),
    reserved: [],
  }
  const numbers = new Set<number>()
  const addField = (field: FieldDefinition): void => {
    if (numbers.has(field.id)) throw new Error('Duplicate Protobuf field number')
    numbers.add(field.id)
    insert(definition.fields, field.name, field)
  }
  for (const statement of node.messageBody.statements) {
    switch (statement.type) {
      case 'option':
        addOption(options, statement)
        break
      case 'reserved':
        definition.reserved.push(...reservations(statement, fieldMax))
        break
      case 'field':
      case 'map-field':
        addField(readField(statement, syntax))
        break
      case 'oneof':
        addOneof(definition, statement, syntax, addField)
        break
      case 'message':
      case 'enum': {
        const child = statement.type === 'enum' ? readEnum(statement) : readMessage(statement, syntax, depth + 1)
        insert(definition.nested, child.name, child)
        break
      }
      case 'empty':
        break
      default:
        throw new Error('Unsupported or malformed Protobuf declaration')
    }
  }
  return definition
}

/** Parse a complete file using pbkit, then retain the fields used by Scalar's schema reader. */
export const parseProtobuf = (source: string, defaultSyntax: Syntax): ProtoDocument => {
  const { ast, parser } = parse(source)
  // pbkit can return an AST for only the valid prefix of a file.
  if (parser.loc !== source.length) throw new Error('Trailing Protobuf source')

  const declaration = ast.statements[0]
  const syntax = declaration?.type === 'syntax' ? declaration.syntax.text : defaultSyntax
  if (syntax !== 'proto2' && syntax !== 'proto3') throw new Error('Unsupported Protobuf syntax')

  const root: Scope = {
    syntaxType: 'ProtoRoot',
    name: '',
    nested: Object.create(null),
    options: Object.create(null),
  }
  let scope: Scope = root
  let importCount = 0
  let seenDefinition = false
  for (const statement of ast.statements) {
    switch (statement.type) {
      case 'syntax':
        if (statement !== declaration) throw new Error('Misplaced Protobuf syntax declaration')
        if (statement.quoteOpen.text !== statement.quoteClose.text)
          throw new Error('Malformed Protobuf syntax declaration')
        break
      case 'package': {
        if (scope !== root || seenDefinition) throw new Error('Misplaced Protobuf package declaration')
        const packageName = qualifiedName(statement.fullIdent)
        if (!fullIdentifier.test(packageName)) throw new Error('Malformed Protobuf package name')
        for (const name of packageName.split('.')) {
          const nested: Scope = {
            syntaxType: 'NamespaceDefinition',
            name,
            nested: Object.create(null),
          }
          insert(scope.nested, name, nested)
          scope = nested
        }
        break
      }
      case 'import':
        if (seenDefinition) throw new Error('Misplaced Protobuf import')
        importCount++
        break
      case 'option':
        addOption((scope.options ??= Object.create(null)), statement, 'file')
        break
      case 'message':
      case 'enum': {
        seenDefinition = true
        const child = statement.type === 'enum' ? readEnum(statement) : readMessage(statement, syntax, 0)
        insert(scope.nested, child.name, child)
        break
      }
      case 'empty':
        break
      default:
        throw new Error('Unsupported Protobuf declaration')
    }
  }
  return { root, syntax, importCount }
}
