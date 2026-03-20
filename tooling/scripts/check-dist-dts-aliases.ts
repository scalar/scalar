import type { Dirent } from 'node:fs'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT_DIR = process.cwd()
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages')
const ALIAS_IMPORT_REGEX = /\bfrom\s+['"]@\/|import\(\s*['"]@\//

const readDirSafe = async (dirPath: string): Promise<Dirent[]> => {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true })
  } catch {
    return []
  }
}

const collectDtsFiles = async (dirPath: string): Promise<string[]> => {
  const entries = await readDirSafe(dirPath)
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        return collectDtsFiles(fullPath)
      }

      return entry.isFile() && entry.name.endsWith('.d.ts') ? [fullPath] : []
    }),
  )

  return files.flat()
}

type CommentState = { inBlockComment: boolean }

const stripComments = (line: string, state: CommentState): string => {
  let index = 0
  let output = ''

  while (index < line.length) {
    if (state.inBlockComment) {
      const blockEnd = line.indexOf('*/', index)
      if (blockEnd === -1) {
        return output
      }

      state.inBlockComment = false
      index = blockEnd + 2
      continue
    }

    const lineCommentStart = line.indexOf('//', index)
    const blockCommentStart = line.indexOf('/*', index)

    if (lineCommentStart === -1 && blockCommentStart === -1) {
      output += line.slice(index)
      break
    }

    if (blockCommentStart !== -1 && (lineCommentStart === -1 || blockCommentStart < lineCommentStart)) {
      output += line.slice(index, blockCommentStart)
      state.inBlockComment = true
      index = blockCommentStart + 2
      continue
    }

    output += line.slice(index, lineCommentStart)
    break
  }

  return output
}

type AliasMatch = { line: number; content: string }

const getAliasImportMatches = (fileContent: string): AliasMatch[] => {
  const matches: AliasMatch[] = []
  const state: CommentState = { inBlockComment: false }
  const lines = fileContent.split('\n')

  lines.forEach((line, idx) => {
    const codeLine = stripComments(line, state)

    if (ALIAS_IMPORT_REGEX.test(codeLine)) {
      matches.push({
        line: idx + 1,
        content: line.trim(),
      })
    }
  })

  return matches
}

type LeakedImport = { file: string; line: number; content: string }

const run = async (): Promise<void> => {
  const packageEntries = await readDirSafe(PACKAGES_DIR)
  const leakedImports: LeakedImport[] = []

  for (const packageEntry of packageEntries) {
    if (!packageEntry.isDirectory()) {
      continue
    }

    const packageDist = path.join(PACKAGES_DIR, packageEntry.name, 'dist')
    const dtsFiles = await collectDtsFiles(packageDist)

    for (const dtsFile of dtsFiles) {
      const fileContent = await fs.readFile(dtsFile, 'utf8')
      const matches = getAliasImportMatches(fileContent)

      for (const match of matches) {
        leakedImports.push({
          file: path.relative(ROOT_DIR, dtsFile),
          line: match.line,
          content: match.content,
        })
      }
    }
  }

  if (leakedImports.length > 0) {
    console.error('Found unresolved "@/..." alias imports in built declaration files:\n')

    leakedImports.forEach((match) => {
      console.error(`${match.file}:${match.line}`)
      console.error(`  ${match.content}`)
    })

    process.exit(1)
  }

  console.log('No unresolved "@/..." alias imports found in packages/*/dist/**/*.d.ts')
}

await run()
