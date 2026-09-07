import fs from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

/**
 * Creates a JSON writer rooted at the real output directory. The caller must keep this
 * directory and its ancestors safe from concurrent changes by untrusted processes.
 */
export const createChunkWriter = async (
  directory: string,
): Promise<(segments: string[], value: unknown) => Promise<void>> => {
  await fs.mkdir(directory, { recursive: true })
  // Configured output roots may intentionally be symlinks, as may system directories such as /tmp.
  const root = await fs.realpath(directory)

  return async (segments, value): Promise<void> => {
    const filename = resolve(root, ...segments)
    const relativePath = relative(root, filename)
    if (!relativePath || isAbsolute(relativePath) || relativePath === '..' || relativePath.startsWith(`..${sep}`)) {
      throw new Error('Chunk path must stay inside the output directory')
    }

    // Check each ancestor before creating its children: recursive mkdir would follow a symlink
    // and could create directories outside the root before we had a chance to validate it.
    let parent = root
    const parentPath = relative(root, dirname(filename))
    for (const segment of parentPath ? parentPath.split(sep) : []) {
      parent = resolve(parent, segment)
      await fs.mkdir(parent).catch((error: unknown) => {
        if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) {
          throw error
        }
      })
      const stat = await fs.lstat(parent)
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error('Chunk directories must be real directories, not symbolic links')
      }
    }

    const stat = await fs.lstat(filename).catch((error: unknown) => {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return undefined
      }
      throw error
    })
    if (stat && (!stat.isFile() || stat.isSymbolicLink())) {
      throw new Error('Chunk destinations must be regular files, not symbolic links')
    }
    await fs.writeFile(filename, JSON.stringify(value))
  }
}
