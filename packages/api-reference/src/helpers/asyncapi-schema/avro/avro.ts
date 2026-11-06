import { isObject } from '@scalar/helpers/object/is-object'

import { type SchemaDocument, type SchemaNode, createBudget } from '../types'
import { matchesDefault } from './default-value'
import { logicalTypeDetails } from './logical-type'
import { parseSource } from './parse-source'

const primitives = new Set(['null', 'boolean', 'int', 'long', 'float', 'double', 'bytes', 'string'])
const namePattern = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/

/** Read Avro definitions without changing null unions or reader defaults into optional fields. */
export const readAvro = (source: unknown, version = '1.9.0', encoding: 'json' | 'yaml' = 'json'): SchemaDocument => {
  const names = new Map<string, Record<string, unknown>>()
  const budget = createBudget()
  const visit = (
    value: unknown,
    name: string,
    namespace = '',
    ancestors = new Set<unknown>(),
    depth = 0,
  ): SchemaNode => {
    budget(depth)
    if (typeof value === 'string') {
      if (primitives.has(value)) {
        return { name, type: value }
      }
      const resolvedName = value.includes('.') || !namespace ? value : `${namespace}.${value}`
      const target = names.get(resolvedName)
      if (!target) {
        throw new Error('Unresolved Avro name')
      }
      if (ancestors.has(target)) {
        return { name, type: value, details: ['Recursive reference'] }
      }
      return visit(target, name, resolvedName.split('.').slice(0, -1).join('.'), ancestors, depth + 1)
    }
    if (Array.isArray(value)) {
      if (!value.length || value.some(Array.isArray)) {
        throw new Error('Invalid Avro union')
      }
      const branches = new Set<string>()
      const children = value.map((member, index) => {
        const child = visit(member, `Variant ${index + 1}`, namespace, ancestors, depth + 1)
        const reference = typeof member === 'string' ? member : isObject(member) ? member.type : undefined
        const key =
          typeof reference === 'string' &&
          !primitives.has(reference) &&
          (typeof member === 'string' || !['record', 'enum', 'fixed', 'array', 'map'].includes(reference))
            ? `named:${reference.includes('.') || !namespace ? reference : `${namespace}.${reference}`}`
            : /^(record|enum|fixed) /.test(child.type)
              ? `named:${child.type.replace(/^(record|enum|fixed) /, '')}`
              : `type:${child.type}`
        if (branches.has(key)) {
          throw new Error('Duplicate Avro union branch')
        }
        branches.add(key)
        return child
      })
      return { name, type: 'union', children }
    }
    if (!isObject(value) || typeof value.type !== 'string' || ancestors.has(value)) {
      throw new Error('Invalid Avro schema')
    }
    const path = new Set([...ancestors, value])
    const node: SchemaNode = { name, type: value.type }
    if (typeof value.doc === 'string') {
      node.description = value.doc
    }
    const details = logicalTypeDetails(value, version)
    if (value.doc !== undefined && typeof value.doc !== 'string') {
      throw new Error('Invalid Avro documentation')
    }
    if (value.aliases !== undefined) {
      if (!Array.isArray(value.aliases) || !value.aliases.every((alias) => typeof alias === 'string')) {
        throw new Error('Invalid Avro aliases')
      }
      details.push(`aliases: ${JSON.stringify(value.aliases)}`)
    }
    if (
      !(typeof value.name === 'string' && value.name.includes('.')) &&
      value.namespace !== undefined &&
      (typeof value.namespace !== 'string' || (value.namespace !== '' && !namePattern.test(value.namespace)))
    ) {
      throw new Error('Invalid Avro namespace')
    }
    const scope = typeof value.namespace === 'string' ? value.namespace : namespace
    if (['record', 'enum', 'fixed'].includes(value.type)) {
      if (
        typeof value.name !== 'string' ||
        !namePattern.test(value.name) ||
        primitives.has(value.name.split('.').at(-1)!)
      ) {
        throw new Error('Invalid Avro name')
      }
      const fullName = value.name.includes('.') || !scope ? value.name : `${scope}.${value.name}`
      const existing = names.get(fullName)
      if (existing && existing !== value) {
        throw new Error('Duplicate Avro name')
      }
      names.set(fullName, value)
      node.type = `${value.type} ${fullName}`
    }
    const childNamespace =
      typeof value.name === 'string' && value.name.includes('.') ? value.name.split('.').slice(0, -1).join('.') : scope
    if (value.type === 'record') {
      if (!Array.isArray(value.fields)) {
        throw new Error('Invalid Avro record')
      }
      const fields = new Set<string>()
      node.children = value.fields.map((field) => {
        if (
          !isObject(field) ||
          typeof field.name !== 'string' ||
          !/^[A-Za-z_][A-Za-z0-9_]*$/.test(field.name) ||
          fields.has(field.name)
        ) {
          throw new Error('Invalid Avro field')
        }
        fields.add(field.name)
        const child = visit(field.type, field.name, childNamespace, path, depth + 1)
        if (typeof field.doc === 'string') {
          child.description = field.doc
        }
        if ('default' in field) {
          if (!matchesDefault(field.type, field.default, childNamespace, names, budget, depth + 1)) {
            throw new Error('Invalid or imprecise Avro reader default')
          }
          child.readerDefault = field.default
        }
        if (field.order !== undefined) {
          if (!['ascending', 'descending', 'ignore'].includes(String(field.order))) {
            throw new Error('Invalid Avro field order')
          }
          child.details = [...(child.details ?? []), `Order: ${field.order}`]
        }
        if (field.aliases !== undefined) {
          if (!Array.isArray(field.aliases) || !field.aliases.every((alias) => typeof alias === 'string')) {
            throw new Error('Invalid Avro field aliases')
          }
          child.details = [...(child.details ?? []), `aliases: ${JSON.stringify(field.aliases)}`]
        }
        return child
      })
    } else if (value.type === 'array' || value.type === 'map') {
      node.children = [
        visit(
          value.type === 'array' ? value.items : value.values,
          value.type === 'array' ? 'Items' : 'Values',
          namespace,
          path,
          depth + 1,
        ),
      ]
    } else if (value.type === 'enum') {
      if (
        !Array.isArray(value.symbols) ||
        !value.symbols.every((symbol) => typeof symbol === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(symbol)) ||
        new Set(value.symbols).size !== value.symbols.length
      ) {
        throw new Error('Invalid Avro enum')
      }
      details.push(`Symbols: ${value.symbols.join(', ')}`)
      if (version === '1.9.0' && value.default !== undefined) {
        if (typeof value.default !== 'string' || !value.symbols.includes(value.default)) {
          throw new Error('Invalid Avro enum default')
        }
        details.push(`Reader enum default: ${value.default}`)
      }
    } else if (value.type === 'fixed') {
      if (typeof value.size !== 'number' || !Number.isInteger(value.size) || value.size < 0) {
        throw new Error('Invalid fixed size')
      }
      details.push(`Size: ${value.size} bytes`)
    } else if (!primitives.has(value.type)) {
      return visit(value.type, name, namespace, ancestors, depth + 1)
    }
    if (details.length) {
      node.details = details
    }
    return node
  }
  return { nodes: [visit(parseSource(source, encoding), 'Schema')] }
}
