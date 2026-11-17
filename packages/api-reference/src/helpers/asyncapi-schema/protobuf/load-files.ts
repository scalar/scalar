import { protobufImports } from '@scalar/workspace-store/helpers/async-api-schema-resources/protobuf-imports'
import type { AsyncApiSchemaResources } from '@scalar/workspace-store/helpers/async-api-schema-resources/resources'
import { schemaResourcePath } from '@scalar/workspace-store/helpers/async-api-schema-resources/schema-resource-path'
import { type ProtoDocument, parse } from 'proto-parser'

import type { Definition } from './ast'

/** File identity and syntax remain available after namespaces are combined. */
export type ProtobufFile = { document: ProtoDocument; imports: { file: ProtobufFile; public: boolean }[] }

/** Parse a closed dependency graph without granting transitive private import visibility. */
export const loadProtobufFiles = (
  source: string,
  version: string,
  resources?: AsyncApiSchemaResources,
): {
  root: ProtobufFile
  files: ProtobufFile[]
  owners: WeakMap<Definition, ProtobufFile>
} => {
  const files = new Map<string, ProtobufFile>()
  const active = new Set<string>()
  const owners = new WeakMap<Definition, ProtobufFile>()
  const state = { size: source.length, nodes: 0 }
  const load = (text: string, uri: string, depth: number, root = false): ProtobufFile => {
    if (depth > 20 || text.length > 200_000 || state.size > 1_000_000 || active.has(uri))
      throw new Error('Invalid Protobuf dependency graph')
    const cached = files.get(uri)
    if (cached) return cached
    if (files.size >= 65) throw new Error('Too many Protobuf dependencies')
    active.add(uri)
    const document = parse(text, {
      keepCase: true,
      alternateCommentMode: true,
      defaultSyntax: root && version === '3' ? 'proto3' : 'proto2',
      resolve: false,
      weakResolve: false,
    })
    if (document.syntaxType === 'ProtoError') throw document.error
    if (root && document.syntax !== `proto${version}`) throw new Error('Conflicting Protobuf version')
    const file: ProtobufFile = { document, imports: [] }
    files.set(uri, file)
    const own = (node: Definition, level: number): void => {
      if (level > 40 || ++state.nodes > 2000) throw new Error('Protobuf is too large')
      owners.set(node, file)
      if (node.syntaxType === 'MessageDefinition') {
        for (const field of Object.values(node.fields)) owners.set(field, file)
        for (const oneof of Object.values(node.oneofs ?? {})) owners.set(oneof, file)
      }
      if ('nested' in node) for (const child of Object.values(node.nested ?? {})) own(child, level + 1)
    }
    own(document.root, 0)
    const imports = protobufImports(text)
    if (imports.length !== (document.imports?.length ?? 0) + (document.weakImports?.length ?? 0))
      throw new Error('Unsupported Protobuf imports')
    for (const dependency of imports) {
      // Weak-import runtime substitution is outside this documentation reader's supported subset.
      if (dependency.visibility === 'weak' || !resources) throw new Error('Unsupported Protobuf import')
      const path = schemaResourcePath(uri, dependency.path)
      const content = Object.hasOwn(resources.files, path) ? resources.files[path] : undefined
      if (typeof content !== 'string') throw new Error('Missing Protobuf dependency')
      if (!files.has(path)) state.size += content.length
      file.imports.push({ file: load(content, path, depth + 1), public: dependency.visibility === 'public' })
    }
    active.delete(uri)
    return file
  }
  const root = load(source, resources?.origin ?? '', 0, true)
  return { root, files: [...files.values()], owners }
}

/** Only namespaces merge; duplicate declarations keep the original source view. */
export const mergeProtobufNamespaces = (target: Definition, source: Definition): void => {
  if (!('nested' in target) || !('nested' in source)) return
  target.nested ??= {}
  for (const [name, value] of Object.entries(source.nested ?? {})) {
    const existing = Object.hasOwn(target.nested, name) ? target.nested[name] : undefined
    if (existing) {
      if (existing.syntaxType !== 'NamespaceDefinition' || value.syntaxType !== 'NamespaceDefinition')
        throw new Error('Conflicting Protobuf names')
      mergeProtobufNamespaces(existing, value)
    } else Object.defineProperty(target.nested, name, { value, enumerable: true, writable: true, configurable: true })
  }
}

/** Public imports re-export their own public closure, not private dependencies. */
export const visibleProtobufFiles = (file: ProtobufFile): Set<ProtobufFile> => {
  const visible = new Set<ProtobufFile>([file])
  const expose = (value: ProtobufFile): void => {
    if (visible.has(value)) return
    visible.add(value)
    for (const dependency of value.imports) if (dependency.public) expose(dependency.file)
  }
  for (const dependency of file.imports) expose(dependency.file)
  return visible
}
