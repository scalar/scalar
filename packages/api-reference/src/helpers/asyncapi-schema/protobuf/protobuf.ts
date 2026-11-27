import type { AsyncApiSchemaResources } from '@scalar/workspace-store/helpers/async-api-schema-resources/resources'

import { type SchemaDocument, type SchemaNode, createBudget } from '../types'
import { type Definition, type EnumDefinition, type MessageDefinition, isEnum, isMessage, isScalar } from './ast'
import { loadProtobufFiles, mergeProtobufNamespaces, visibleProtobufFiles } from './load-files'
import { resolveType } from './resolve-type'
import { checkOptions, validateEnum, validateField, validateNamespace } from './validate'

/** Read a closed native dependency graph without a Protobuf serialization runtime. */
export const readProtobuf = (source: unknown, version: string, resources?: AsyncApiSchemaResources): SchemaDocument => {
  if (typeof source !== 'string') throw new Error('Expected Protobuf source')
  const { root, files, owners } = loadProtobufFiles(source, version, resources)
  const parsed = root.document
  for (const file of files) if (file !== root) mergeProtobufNamespaces(parsed.root, file.document.root)
  const budget = createBudget()
  const definitions: (MessageDefinition | EnumDefinition)[] = []
  const parents = new WeakMap<Definition, Definition>()
  const collect = (namespace: Definition, depth = 0): void => {
    budget(depth)
    validateNamespace(namespace)
    for (const value of Object.values(('nested' in namespace ? namespace.nested : undefined) ?? {})) {
      parents.set(value, namespace)
      value.fullName = `${namespace.fullName ?? ''}.${value.name}`
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
    const file = owners.get(definition)
    if (!file) throw new Error('Unknown Protobuf definition')
    const version = file.document.syntax === 'proto2' ? '2' : '3'
    const visible = visibleProtobufFiles(file)
    const accessible = (node: Definition): boolean =>
      node.syntaxType === 'ProtoRoot' ||
      (node.syntaxType === 'NamespaceDefinition'
        ? Object.values(node.nested ?? {}).some(accessible)
        : visible.has(owners.get(node)!))
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
    checkOptions(definition.options, ['deprecated'])
    const path = new Set([...ancestors, definition])
    node.children = Object.values(definition.fields).map((field) => {
      budget(depth + 1)
      const target = resolveType(definition, field.type.value, parents, accessible)
      if (version === '3' && isEnum(target) && owners.get(target)?.document.syntax === 'proto2')
        throw new Error('Proto3 cannot directly use proto2 enums')
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
      const child: SchemaNode = field.keyType
        ? {
            name: field.name,
            type: `map<${field.keyType.value}, ${field.type.value}>`,
            mapKey: field.keyType.value,
            mapValue: { ...valueNode, name: 'Values' },
          }
        : valueNode
      if (field.comment) {
        child.description = field.comment
      }
      child.fieldNumber = field.id
      const details: string[] = []
      const oneof = Object.values(definition.oneofs ?? {}).find((group) => group.oneof.includes(field.name))
      if (field.keyType) {
        // Maps have neither singular presence nor a repeated field label.
      } else if (field.rule === 'repeated') {
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
      const defaultValue = field.options?.default
      if (defaultValue !== undefined) {
        const literal =
          typeof defaultValue === 'number' && !Number.isFinite(defaultValue)
            ? String(defaultValue)
            : JSON.stringify(defaultValue)
        // A bytes default is a sequence of octets. Escape non-ASCII octets to display the exact bytes.
        const display =
          field.type.value === 'bytes'
            ? literal.replace(/[^\x20-\x7e]/g, (byte) => `\\x${byte.charCodeAt(0).toString(16).padStart(2, '0')}`)
            : literal
        details.push(`Default: ${display}`)
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
  const nodes = definitions.map((definition) => ({ definition, node: visit(definition, definition.name) }))
  const local = nodes.filter(({ definition }) => owners.get(definition) === root).map(({ node }) => node)
  if (!local.length) throw new Error('No local Protobuf definitions')
  return { nodes: local }
}
