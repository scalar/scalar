import type { Schema } from './schema'

const DEFAULT_MAX_DEPTH = 10

export type GenerateTypesOptions = {
  maxDepth?: number
}

type NamedDeclaration = {
  name: string
  body: string
  comment?: string
}

type TypeGenContext = {
  maxDepth: number
  definitions: Map<string, string>
  declarations: NamedDeclaration[]
  inProgress: Set<string>
}

/**
 * Returns TypeScript for the schema: named `typeName` nodes become `export type` aliases (once each),
 * referenced by name elsewhere. With no named nodes, returns a single inline type expression (same as before).
 */
export const generateTypes = (schema: Schema, options?: GenerateTypesOptions): string => {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH
  const ctx: TypeGenContext = {
    maxDepth,
    definitions: new Map(),
    declarations: [],
    inProgress: new Set(),
  }
  const root = emitSchema(schema, maxDepth, ctx, '')

  if (ctx.declarations.length === 0) {
    return root
  }

  const declStrings = ctx.declarations.map(formatNamedDeclaration)
  const body = declStrings.join('\n\n')
  const lastDeclared = ctx.declarations.at(-1)?.name

  if (lastDeclared === root) {
    return body
  }

  return `${body}\n\n${root}`
}

const formatNamedDeclaration = (d: NamedDeclaration): string => {
  const commentBlock = d.comment ? formatTypeCommentAsJsDoc(d.comment) : ''
  const comment = commentBlock ? `${commentBlock}\n` : ''
  return `${comment}export type ${d.name} = ${d.body}`
}

/** Inline JSDoc for one line; multi-line comments use a newline after the opening delimiter and ` * ` on each line. */
const formatTypeCommentAsJsDoc = (comment: string): string => {
  const lines = comment.split(/\r?\n/)
  const trimmed = lines.map((line) => line.trim())
  while (trimmed.length > 0 && trimmed[0] === '') {
    trimmed.shift()
  }
  while (trimmed.length > 0 && trimmed.at(-1) === '') {
    trimmed.pop()
  }
  if (trimmed.length === 0) {
    return ''
  }
  if (trimmed.length === 1) {
    return `/** ${trimmed[0]} */`
  }
  const body = trimmed.map((line) => ` * ${line}`).join('\n')
  return `/** \n${body}\n */`
}

/** Prefixes each line of a JSDoc block with `indent` for object property comments. */
const formatTypeCommentAsIndentedJsDoc = (indent: string, comment: string): string => {
  const doc = formatTypeCommentAsJsDoc(comment)
  if (!doc) {
    return ''
  }
  return doc.split('\n').map((line) => `${indent}${line}`).join('\n')
}

const getTypeName = (schema: Schema): string | undefined => {
  if (schema.type === 'lazy' || schema.type === 'evaluate') {
    return undefined
  }
  const name = schema.typeName
  if (!name || !isValidTypeScriptIdentifier(name)) {
    return undefined
  }
  return name
}

const getTypeComment = (schema: Schema): string | undefined => {
  if (schema.type === 'lazy' || schema.type === 'evaluate') {
    return undefined
  }
  return schema.typeComment
}

const isValidTypeScriptIdentifier = (name: string): boolean => /^[$_A-Za-z][$_\w]*$/.test(name)

const emitSchema = (schema: Schema, depth: number, ctx: TypeGenContext, braceIndent: string): string => {
  const name = getTypeName(schema)
  if (name) {
    if (ctx.definitions.has(name)) {
      return name
    }
    if (ctx.inProgress.has(name)) {
      return name
    }
    ctx.inProgress.add(name)
    const body = structuralEmit(schema, depth, ctx, '')
    ctx.inProgress.delete(name)
    if (!ctx.definitions.has(name)) {
      ctx.definitions.set(name, body)
      ctx.declarations.push({
        name,
        body,
        comment: getTypeComment(schema),
      })
    }
    return name
  }
  return structuralEmit(schema, depth, ctx, braceIndent)
}

const structuralEmit = (schema: Schema, depth: number, ctx: TypeGenContext, braceIndent: string): string => {
  if (depth <= 0) {
    return 'any'
  }
  const next = depth - 1

  switch (schema.type) {
    case 'number':
      return 'number'
    case 'string':
      return 'string'
    case 'boolean':
      return 'boolean'
    case 'nullable':
      return 'null'
    case 'notDefined':
      return 'undefined'
    case 'any':
      return 'any'
    case 'array': {
      const item = emitSchema(schema.items, next, ctx, braceIndent)
      return needsArrayItemParen(item) ? `(${item})[]` : `${item}[]`
    }
    case 'record': {
      const key = emitSchema(schema.key, next, ctx, braceIndent)
      const value = emitSchema(schema.value, next, ctx, braceIndent)
      return `Record<${key}, ${value}>`
    }
    case 'object': {
      const entries = Object.entries(schema.properties)
      if (entries.length === 0) {
        return '{}'
      }
      const keyIndent = `${braceIndent}  `
      const props = entries.map(([key, child]) => {
        const tsKey = /^[$_a-zA-Z][$_\w]*$/.test(key) ? key : JSON.stringify(key)
        const value = emitSchema(child, next, ctx, keyIndent)
        const propComment = getTypeComment(child)
        const docBlock = propComment ? formatTypeCommentAsIndentedJsDoc(keyIndent, propComment) : ''
        const propLine = `${keyIndent}${tsKey}: ${value};`
        return docBlock ? `${docBlock}\n${propLine}` : propLine
      })
      return `{\n${props.join('\n')}\n${braceIndent}}`
    }
    case 'union':
      return schema.schemas.map((s) => wrapUnionMember(emitSchema(s, next, ctx, braceIndent))).join(' | ')
    case 'literal':
      return literalToTs(schema.value)
    case 'lazy':
      return emitSchema(schema.schema(), next, ctx, braceIndent)
    case 'evaluate':
      return emitSchema(schema.schema, next, ctx, braceIndent)
    default: {
      const _exhaustive: never = schema
      return _exhaustive
    }
  }
}

const literalToTs = (value: string | number | boolean | bigint): string => {
  if (typeof value === 'bigint') {
    return `${value}n`
  }
  return JSON.stringify(value)
}

const needsArrayItemParen = (t: string): boolean => {
  if (t === 'number' || t === 'string' || t === 'boolean' || t === 'null' || t === 'undefined' || t === 'any') {
    return false
  }
  return t.includes(' | ')
}

const wrapUnionMember = (t: string): string => {
  if (t === 'number' || t === 'string' || t === 'boolean' || t === 'null' || t === 'undefined' || t === 'any') {
    return t
  }
  if (/^(?:-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?|-?\d+n|"(?:[^"\\]|\\.)*"|true|false)$/.test(t)) {
    return t
  }
  if (/^[$_A-Za-z][$_\w]*$/.test(t)) {
    return t
  }
  return `(${t})`
}
