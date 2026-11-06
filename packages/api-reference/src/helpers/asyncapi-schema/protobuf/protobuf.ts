import protobuf from 'protobufjs'

import { type SchemaDocument, type SchemaNode, createBudget } from '../types'
import { resolveType } from './resolve-type'
import { checkOptions, validateEnum, validateField, validateNamespace } from './validate'

/** Read reflection metadata only; never load imports or generate message constructors. */
export const readProtobuf = (source: unknown, version: string): SchemaDocument => {
  if (typeof source !== 'string') {
    throw new Error('Expected Protobuf source')
  }
  const tokenizer = protobuf.tokenize(source, true)
  const first = tokenizer.next()
  if (first === 'edition') {
    throw new Error('Unsupported Protobuf edition')
  }
  if (first === 'syntax') {
    const equals = tokenizer.next()
    const quote = tokenizer.next()
    const syntax = tokenizer.next()
    if (equals !== '=' || !['"', "'"].includes(quote ?? '') || syntax !== `proto${version}`) {
      throw new Error('Conflicting Protobuf version')
    }
  }
  // schemaFormat supplies the syntax when an inline fragment omits its declaration.
  const parsed = protobuf.parse(first === 'syntax' ? source : `syntax = "proto${version}";\n${source}`, {
    keepCase: true,
    alternateCommentMode: true,
  })
  if (parsed.imports?.length || parsed.weakImports?.length) {
    throw new Error('Unsupported Protobuf imports')
  }
  const budget = createBudget()
  const definitions: (protobuf.Type | protobuf.Enum)[] = []
  const collect = (namespace: protobuf.Namespace, depth = 0): void => {
    budget(depth)
    validateNamespace(namespace)
    for (const value of namespace.nestedArray) {
      if (value.options && Object.keys(value.options).some((key) => key.startsWith('('))) {
        throw new Error('Unsupported custom Protobuf options')
      }
      if (value instanceof protobuf.Service || value instanceof protobuf.Field) {
        throw new Error('Unsupported Protobuf declaration')
      }
      if (value instanceof protobuf.Type || value instanceof protobuf.Enum) {
        definitions.push(value)
      }
      if (value instanceof protobuf.Namespace) {
        collect(value, depth + 1)
      }
    }
  }
  collect(parsed.root)
  if (!definitions.length) {
    throw new Error('No Protobuf definitions')
  }
  const visit = (
    definition: protobuf.Type | protobuf.Enum,
    name: string,
    ancestors = new Set<protobuf.ReflectionObject>(),
    depth = 0,
  ): SchemaNode => {
    budget(depth)
    const node: SchemaNode = {
      name,
      type: `${definition instanceof protobuf.Enum ? 'enum' : 'message'} ${definition.fullName.replace(/^\./, '')}`,
    }
    if (definition.comment) {
      node.description = definition.comment
    }
    if (ancestors.has(definition)) {
      return { ...node, details: ['Recursive reference'] }
    }
    if (definition instanceof protobuf.Enum) {
      validateEnum(definition, version)
      node.children = Object.entries(definition.values).map(([name, value]) => {
        budget(depth + 1)
        return {
          name,
          type: String(value),
          ...(definition.comments?.[name] ? { description: definition.comments[name]! } : {}),
          ...(definition.valuesOptions?.[name]?.deprecated !== undefined
            ? { details: [`deprecated: ${definition.valuesOptions[name].deprecated}`] }
            : {}),
        }
      })
      return node
    }
    if (definition.toJSON().group || definition.extensions?.length) {
      throw new Error('Unsupported Protobuf groups or extensions')
    }
    checkOptions(definition.options, ['deprecated'])
    const path = new Set([...ancestors, definition])
    node.children = definition.fieldsArray.map((field) => {
      budget(depth + 1)
      if (field.extend) {
        throw new Error('Unsupported Protobuf extension')
      }
      const target = resolveType(definition, field.type)
      validateField(definition, field, target, version)
      const valueNode =
        target instanceof protobuf.Type || target instanceof protobuf.Enum
          ? visit(target, field.name, path, depth + 1)
          : { name: field.name, type: field.type }
      if (!target && !Object.hasOwn(protobuf.types.basic, field.type)) {
        throw new Error('Unresolved Protobuf type')
      }
      if (target && !(target instanceof protobuf.Type || target instanceof protobuf.Enum)) {
        throw new Error('Invalid Protobuf type')
      }
      const child: SchemaNode =
        field instanceof protobuf.MapField
          ? {
              name: field.name,
              type: `map<${field.keyType}, ${field.type}>`,
              mapKey: field.keyType,
              mapValue: { ...valueNode, name: 'Values' },
            }
          : valueNode
      if (field.comment) {
        child.description = field.comment
      }
      child.fieldNumber = field.id
      const details: string[] = []
      if (field instanceof protobuf.MapField) {
        // Maps have neither singular presence nor a repeated field label.
      } else if (field.repeated) {
        details.push('Repeated')
      } else if (field.toJSON().rule === 'required') {
        details.push('Required')
      } else if (field.options?.proto3_optional) {
        details.push('Optional (explicit presence)')
      } else if (field.partOf) {
        child.oneofGroup = field.partOf.name
      } else if (version === '2') {
        details.push('Optional')
      } else {
        details.push(target instanceof protobuf.Type ? 'Optional (explicit presence)' : 'Optional (implicit presence)')
      }
      if (field.options?.default !== undefined) {
        details.push(
          `Default: ${typeof field.options.default === 'number' && !Number.isFinite(field.options.default) ? String(field.options.default) : JSON.stringify(field.options.default)}`,
        )
      }
      for (const key of ['packed', 'deprecated', 'json_name']) {
        if (field.options?.[key] !== undefined) {
          details.push(`${key}: ${JSON.stringify(field.options[key])}`)
        }
      }
      child.details = [...details, ...(child.details ?? [])]
      return child
    })
    return node
  }
  // A file can declare several independent messages. Show each, rather than guessing a payload root.
  return { nodes: definitions.map((definition) => visit(definition, definition.name)) }
}
