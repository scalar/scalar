import type { SchemaNode } from '../types'

const builtins = new Set([
  'any',
  'nil',
  'string',
  'number',
  'integer',
  'boolean',
  'object',
  'array',
  'file',
  'date-only',
  'time-only',
  'datetime-only',
  'datetime',
])
/** Parse the RAML type-expression grammar, preserving union and array precedence. */
export const expression = (input: string, name: string, budget: (depth: number) => void, depth: number): SchemaNode => {
  const tokens = input.match(/[A-Za-z_][A-Za-z0-9_.-]*|\[\]|[|()]/g) ?? []
  if (tokens.join('') !== input.replace(/\s/g, '')) {
    throw new Error('Unsupported RAML expression')
  }
  const cursor = { index: 0 }
  const union = (level: number): SchemaNode => {
    budget(level)
    const members: SchemaNode[] = [array(level + 1)]
    while (tokens[cursor.index] === '|') {
      cursor.index++
      members.push(array(level + 1))
    }
    return members.length === 1
      ? members[0]!
      : { name, type: 'union', children: members.map((member, index) => ({ ...member, name: `Variant ${index + 1}` })) }
  }
  const array = (level: number): SchemaNode => {
    budget(level)
    const token = tokens[cursor.index++]
    const node = token === '(' ? union(level + 1) : { name, type: token ?? '' }
    if (token === '(') {
      if (tokens[cursor.index++] !== ')') {
        throw new Error('Unclosed RAML expression')
      }
    } else if (!token || !builtins.has(token)) {
      throw new Error('Unresolved RAML type')
    }
    const wrap = (value: SchemaNode, nesting: number): SchemaNode => {
      budget(nesting)
      if (tokens[cursor.index] !== '[]') {
        return value
      }
      cursor.index++
      return wrap({ name, type: 'array', children: [{ ...value, name: 'Items' }] }, nesting + 1)
    }
    return wrap(node, level + 1)
  }
  const result = union(depth)
  if (cursor.index !== tokens.length) {
    throw new Error('Invalid RAML expression')
  }
  return result
}
