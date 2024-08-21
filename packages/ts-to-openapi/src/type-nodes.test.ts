import fg from 'fast-glob'
import { readFileSync } from 'fs'
import {
  type CompilerHost,
  JSDocParsingMode,
  type Node,
  ScriptKind,
  ScriptTarget,
  SyntaxKind,
  createProgram,
  createSourceFile,
  isTypeNode,
  isTypeReferenceNode,
} from 'typescript'
import { describe, expect, it } from 'vitest'

import { getSchemaFromTypeNode } from './type-nodes'

const compilerHost: CompilerHost = {
  fileExists: () => true,
  getCanonicalFileName: (filename) => filename,
  getCurrentDirectory: () => '',
  getDefaultLibFileName: () => '',
  getNewLine: () => '\n',
  getSourceFile: (filename) =>
    createSourceFile(
      filename,
      readFileSync(filename).toString(),
      ScriptTarget.Latest,
      false,
      ScriptKind.TS,
    ),
  jsDocParsingMode: JSDocParsingMode.ParseAll,
  readFile: () => undefined,
  useCaseSensitiveFileNames: () => true,
  writeFile: () => null,
}

const programFileNames = await fg('src/fixtures/*.ts')

// Intialize typescript program
const program = createProgram(
  programFileNames,
  {
    noResolve: true,
    target: ScriptTarget.Latest,
  },
  compilerHost,
)

const fileResolver = (source: string, target: string) => 'test'

describe('getSchemaFromTypeNode', () => {
  const sourceFile = program.getSourceFile('src/fixtures/types.ts')

  it('should handle the super test type', () => {
    const type = sourceFile?.statements[0]
    console.log(type)
    if (type && isTypeNode(type)) {
      const schema = getSchemaFromTypeNode(type, program, fileResolver)
      console.log(schema)
    }
  })
})
