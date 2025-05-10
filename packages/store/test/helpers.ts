import fs from 'node:fs/promises'

export async function allFilesMatch(fileList: { path: string; content: string }[]): Promise<boolean> {
  for (const { content, path } of fileList) {
    try {
      const actualContent = await fs.readFile(path, 'utf8')
      if (actualContent !== content) {
        return false
      }
    } catch {
      // If file doesn't exist or any other read error
      return false
    }
  }
  return true
}
