import kleur from 'kleur'
import fs from 'node:fs'

import { isUrl } from './isUrl'

/**
 * Pass a file path or URL and get the content of the file.
 */
export async function getFileOrUrl(input: string): Promise<string> {
  if (isUrl(input)) {
    const response = await fetch(input)

    if (!response.ok) {
      console.error(
        kleur.bold().red('[ERROR]'),
        kleur.bold().red('Failed to fetch OpenAPI specification from URL.'),
      )

      return ''
    }

    return await response.text()
  }

  if (!fs.existsSync(input)) {
    throw new Error('File not found')
  }

  return fs.readFileSync(input, 'utf-8')
}
