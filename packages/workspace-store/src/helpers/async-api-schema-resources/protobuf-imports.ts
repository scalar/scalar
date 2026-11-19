/** Import visibility is distinct from loading: only public imports are re-exported. */
export type ProtobufImport = { path: string; visibility: 'private' | 'public' | 'weak' }

/** Read import declarations without mistaking comments or option strings for dependencies. */
export const protobufImports = (source: string): ProtobufImport[] => {
  const tokens =
    source.match(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_][A-Za-z_0-9]*|[^\s]/g) ??
    []
  const meaningful = tokens.filter((token) => !token.startsWith('//') && !token.startsWith('/*'))
  const imports: ProtobufImport[] = []
  const state = { depth: 0 }
  for (const [index, token] of meaningful.entries()) {
    if (token === '{') state.depth++
    if (token === '}') state.depth--
    if (token !== 'import' || state.depth !== 0) continue
    const modifier = meaningful[index + 1]
    const visibility = modifier === 'public' || modifier === 'weak' ? modifier : 'private'
    const offset = visibility === 'private' ? 1 : 2
    const literal = meaningful[index + offset]
    if (!literal || !/^(?:"[^"\\]*"|'[^'\\]*')$/.test(literal) || meaningful[index + offset + 1] !== ';') {
      throw new Error('Unsupported Protobuf import')
    }
    imports.push({ path: literal.slice(1, -1), visibility })
  }
  return imports
}
