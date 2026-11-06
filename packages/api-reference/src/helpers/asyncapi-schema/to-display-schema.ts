import { protobufFieldNumber, protobufPresence, schemaRecursiveTarget } from '@scalar/blocks/schema'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import type { SchemaNode } from './types'

/** Adapt native documentation for the shared renderer only, never for validation or example generation. */
export const toDisplaySchema = (node: SchemaNode): SchemaObject => {
  const details = (node.details ?? []).filter(
    (detail) =>
      ![
        'Required',
        'Optional',
        'Repeated',
        'Recursive reference',
        'Optional (explicit presence)',
        'Optional (implicit presence)',
      ].includes(detail),
  )
  const presence = node.details?.includes('Optional (explicit presence)')
    ? 'explicit'
    : node.details?.includes('Optional (implicit presence)')
      ? 'implicit'
      : undefined
  const mapKey = node.mapKey
  const description = [node.description, ...details, ...(mapKey ? [`Map keys: ${mapKey}`] : [])]
    .filter(Boolean)
    .join('\n\n')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
  const common = {
    ...(presence ? { [protobufPresence]: presence } : {}),
    ...(node.details?.includes('Recursive reference')
      ? { [schemaRecursiveTarget]: node.type.replace(/^(message |record )/, '') }
      : {}),
    ...(description ? { description } : {}),
    ...('readerDefault' in node ? { default: node.readerDefault } : {}),
    ...(node.fieldNumber !== undefined ? { [protobufFieldNumber]: node.fieldNumber } : {}),
  }
  if (node.type === 'any') {
    return common as SchemaObject
  }
  if (node.details?.includes('Repeated')) {
    return {
      ...common,
      type: 'array',
      items: toDisplaySchema({
        ...node,
        description: undefined,
        fieldNumber: undefined,
        details: node.details?.filter((detail) => detail === 'Recursive reference'),
      }),
    }
  }
  if (node.type === 'union') {
    // anyOf is a display projection; native union branches can overlap as JSON values.
    return { ...common, anyOf: (node.children ?? []).map(toDisplaySchema) } as SchemaObject
  }
  if (node.type === 'array') {
    return {
      ...common,
      type: 'array',
      items: node.children?.[0] ? toDisplaySchema(node.children[0]) : ({} as SchemaObject),
    }
  }
  if (node.type === 'map' || node.mapValue) {
    const value = node.mapValue ?? node.children?.[0]
    return { ...common, type: 'object', additionalProperties: value ? toDisplaySchema(value) : true }
  }
  if (node.details?.includes('Recursive reference')) {
    return { ...common, type: 'object', title: node.type }
  }
  if (node.type.startsWith('enum ')) {
    const symbols = node.details
      ?.find((detail) => detail.startsWith('Symbols: '))
      ?.slice(9)
      .split(', ')
      .filter(Boolean)
    if (symbols) {
      return { ...common, type: 'string', enum: symbols, format: node.type }
    }
    const groups = new Map<number, SchemaNode[]>()
    for (const child of node.children ?? []) {
      const value = Number(child.type)
      groups.set(value, [...(groups.get(value) ?? []), child])
    }
    const descriptions = [...groups.values()].map((children) =>
      children
        .map((child) => {
          const text = [child.description?.trim(), ...(child.details ?? [])].filter(Boolean).join('\n\n')
          return text ? `${child.name}: ${text}`.replaceAll('<', '&lt;').replaceAll('>', '&gt;') : ''
        })
        .filter(Boolean)
        .join('\n\n'),
    )
    return {
      ...common,
      type: 'integer',
      format: node.type,
      enum: [...groups.keys()],
      'x-enum-varnames': [...groups.values()].map((children) => children.map(({ name }) => name).join(' / ')),
      ...(descriptions.some(Boolean) ? { 'x-enum-descriptions': descriptions } : {}),
    }
  }
  if (node.type === 'object' || /^(record |message )/.test(node.type) || node.children?.length) {
    const fields = (node.children ?? []).filter((child) => !child.oneofGroup)
    const required = fields.filter((child) => child.details?.includes('Required')).map((child) => child.name)
    const base: SchemaObject = {
      type: 'object',
      properties: Object.fromEntries(fields.map((child) => [child.name, toDisplaySchema(child)])),
      ...(required.length ? { required } : {}),
    }
    const groups = new Map<string, SchemaNode[]>()
    for (const child of node.children ?? []) {
      if (child.oneofGroup) {
        groups.set(child.oneofGroup, [...(groups.get(child.oneofGroup) ?? []), child])
      }
    }
    if (!groups.size) {
      return { ...common, ...base }
    }
    // Keep ordinary field runs and independent oneof groups in declaration order.
    const segments: SchemaObject[] = []
    let pending: SchemaNode[] = []
    const flushFields = (): void => {
      if (!pending.length) {
        return
      }
      const required = pending.filter((child) => child.details?.includes('Required')).map((child) => child.name)
      segments.push({
        type: 'object',
        properties: Object.fromEntries(pending.map((child) => [child.name, toDisplaySchema(child)])),
        ...(required.length ? { required } : {}),
      })
      pending = []
    }
    const emitted = new Set<string>()
    for (const child of node.children ?? []) {
      const name = child.oneofGroup
      if (!name) {
        pending.push(child)
        continue
      }
      if (emitted.has(name)) {
        continue
      }
      flushFields()
      emitted.add(name)
      const members = groups.get(name) ?? []
      segments.push({
        oneOf: [
          ...members.map((member) => ({
            type: 'object' as const,
            title: `${name}: ${member.name}`,
            properties: { [member.name]: toDisplaySchema(member) },
            required: [member.name],
          })),
          {
            type: 'object' as const,
            title: `${name}: Not set`,
            description: `No field in the ${name} group is set.`,
          },
        ],
      } as SchemaObject)
    }
    flushFields()
    return { ...common, allOf: segments } as SchemaObject
  }
  if (['nil', 'null'].includes(node.type)) {
    return { ...common, type: 'null' }
  }
  if (['bool', 'boolean'].includes(node.type)) {
    return { ...common, type: 'boolean' }
  }
  if (/^(u?int\d*|sint\d*|sfixed\d*|fixed\d+|long|integer)$/.test(node.type)) {
    return { ...common, type: 'integer', ...(node.type !== 'integer' ? { format: node.type } : {}) }
  }
  if (['number', 'float', 'double'].includes(node.type)) {
    return { ...common, type: 'number', ...(node.type !== 'number' ? { format: node.type } : {}) }
  }
  return { ...common, type: 'string', ...(node.type !== 'string' ? { format: node.type } : {}) }
}
