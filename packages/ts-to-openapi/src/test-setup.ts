import fg from 'fast-glob'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  type CompilerHost,
  JSDocParsingMode,
  ScriptKind,
  ScriptTarget,
  createProgram,
  createSourceFile,
} from 'typescript'

const compilerHost: CompilerHost = {
  fileExists: () => true,
  getCanonicalFileName: (filename) => filename,
  getCurrentDirectory: () => '',
  getDefaultLibFileName: () => '',
  getNewLine: () => '\n',
  getSourceFile: (filename) =>
    createSourceFile(filename, readFileSync(filename).toString(), ScriptTarget.Latest, false, ScriptKind.TS),
  jsDocParsingMode: JSDocParsingMode.ParseAll,
  readFile: () => undefined,
  useCaseSensitiveFileNames: () => true,
  writeFile: () => null,
}

const programFileNames = await fg(__dirname + '/fixtures/*.ts')

// Intialize typescript program
export const program = createProgram(
  programFileNames,
  {
    noResolve: true,
    target: ScriptTarget.Latest,
  },
  compilerHost,
)

export const fileNameResolver = (source: string, target: string) => {
  const sourceExt = path.extname(source)
  const targetExt = path.extname(target)

  const targetRelative = target + (targetExt ? '' : sourceExt)
  const targetPath = path.join(source.replace(/\/([^/]+)$/, ''), targetRelative)

  return targetPath
}
