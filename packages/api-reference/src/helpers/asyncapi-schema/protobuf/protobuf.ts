import { type EnumDefinition, type MessageDefinition, parse } from 'proto-parser'

import { type SchemaDocument, type SchemaNode, createBudget } from '../types'
import { type Definition, isEnum, isMessage, isScalar } from './ast'
import { resolveType } from './resolve-type'
import { checkOptions, validateEnum, validateField, validateNamespace } from './validate'

/** Read the parser AST without loading imports or a Protobuf serialization runtime. */
export const readProtobuf = (source: unknown, version: string): SchemaDocument => {
  if (typeof source !== 'string') {
    throw new Error('Expected Protobuf source')
  }
  const parsed = parse(source, {
    keepCase: true,
    alternateCommentMode: true,
    defaultSyntax: version === '2' ? 'proto2' : 'proto3',
    // Scalar resolves names lexically and rejects imports; parser resolution is unnecessary.
    resolve: false,
    weakResolve: false,
  })
  if (parsed.syntaxType === 'ProtoError') {
    throw parsed.error
  }
  if (parsed.syntax !== `proto${version}`) {
    throw new Error('Conflicting Protobuf version')
  }
  if (parsed.imports?.length || parsed.weakImports?.length) {
    throw new Error('Unsupported Protobuf imports')
  }
  const budget = createBudget()
  const definitions: (MessageDefinition | EnumDefinition)[] = []
  const parents = new WeakMap<Definition, Definition>()
  const collect = (namespace: Definition, depth = 0): void => {
    budget(depth)
    validateNamespace(namespace)
    for (const value of Object.values(('nested' in namespace ? namespace.nested : undefined) ?? {})) {
      parents.set(value, namespace)
      value.fullName = `${namespace.fullName ?? ''}.${value.name}`
      if (value.options && Object.keys(value.options).some((key) => key.startsWith('('))) {
        throw new Error('Unsupported custom Protobuf options')
      }
      if (value.syntaxType === 'ServiceDefinition' || value.syntaxType === 'FieldDefinition') {
        throw new Error('Unsupported Protobuf declaration')
      }
      if (isMessage(value) || isEnum(value)) {
        definitions.push(value)
      }
      if ('nested' in value || isMessage(value) || isEnum(value)) {
        collect(value, depth + 1)
      }
    }
  }
  collect(parsed.root)
  if (!definitions.length) {
    throw new Error('No Protobuf definitions')
  }
  const visit = (
    definition: MessageDefinition | EnumDefinition,
    name: string,
    ancestors = new Set<Definition>(),
    depth = 0,
  ): SchemaNode => {
    budget(depth)
    const node: SchemaNode = {
      name,
      type: `${isEnum(definition) ? 'enum' : 'message'} ${(definition.fullName ?? definition.name).replace(/^\./, '')}`,
    }
    if (definition.comment) {
      node.description = definition.comment
    }
    if (ancestors.has(definition)) {
      return { ...node, recursive: true }
    }
    if (isEnum(definition)) {
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
    if (definition.group || definition.extensions?.length) {
      throw new Error('Unsupported Protobuf groups or extensions')
    }
    checkOptions(definition.options, ['deprecated'])
    const path = new Set([...ancestors, definition])
    node.children = Object.values(definition.fields).map((field) => {
      budget(depth + 1)
      if (field.extend) {
        throw new Error('Unsupported Protobuf extension')
      }
      const target = resolveType(definition, field.type.value, parents)
      validateField(definition, field, target, version)
      const valueNode =
        isMessage(target) || isEnum(target)
          ? visit(target, field.name, path, depth + 1)
          : { name: field.name, type: field.type.value }
      if (!target && !isScalar(field.type.value)) {
        throw new Error('Unresolved Protobuf type')
      }
      if (target && !(isMessage(target) || isEnum(target))) {
        throw new Error('Invalid Protobuf type')
      }
      const child: SchemaNode = field.map
        ? {
            name: field.name,
            type: `map<${field.keyType?.value}, ${field.type.value}>`,
            mapKey: field.keyType?.value,
            mapValue: { ...valueNode, name: 'Values' },
          }
        : valueNode
      if (field.comment) {
        child.description = field.comment
      }
      child.fieldNumber = field.id
      const details: string[] = []
      const oneof = Object.values(definition.oneofs ?? {}).find((group) => group.oneof.includes(field.name))
      if (field.map) {
        // Maps have neither singular presence nor a repeated field label.
      } else if (field.repeated) {
        child.repeated = true
      } else if (field.rule === 'required') {
        child.required = true
      } else if (field.rule === 'optional' && version === '3' && !oneof) {
        child.presence = 'explicit'
      } else if (oneof) {
        child.oneofGroup = oneof.name
      } else if (version === '2') {
        child.required = false
      } else {
        child.presence = isMessage(target) ? 'explicit' : 'implicit'
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
      if (details.length) {
        child.details = [...details, ...(child.details ?? [])]
      }
      return child
    })
    return node
  }
  // A file can declare several independent messages. Show each, rather than guessing a payload root.
  return { nodes: definitions.map((definition) => visit(definition, definition.name)) }
}
