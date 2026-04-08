import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { ScriptTarget, createProgram } from 'typescript'

const isTypeScriptFile = (fileName: string): boolean => fileName.endsWith('.ts') || fileName.endsWith('.tsx')

/**
 * Recursively collects TypeScript files from a directory.
 */
export const collectTypeScriptFiles = (directoryPath: string): string[] => {
  try {
    const entries = readdirSync(directoryPath, { withFileTypes: true })

    return entries.flatMap((entry) => {
      const filePath = join(directoryPath, entry.name)

      if (entry.isDirectory()) {
        return collectTypeScriptFiles(filePath)
      }

      if (entry.isFile() && isTypeScriptFile(entry.name)) {
        return [filePath]
      }

      return []
    })
  } catch {
    return []
  }
}

type CreateProgramFromFileSystemOptions = {
  rootDirectory: string
  target?: ScriptTarget
}

/**
 * Creates a TypeScript program from all `.ts` and `.tsx` files in a directory tree.
 */
export const createProgramFromFileSystem = ({
  rootDirectory,
  target = ScriptTarget.Latest,
}: CreateProgramFromFileSystemOptions) => {
  const files = collectTypeScriptFiles(rootDirectory)
  return createProgram(files, { target })
}
