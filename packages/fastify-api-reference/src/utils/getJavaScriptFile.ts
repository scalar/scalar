import fs from 'fs'
import path from 'path'

/**
 * Read the JavaScript file.
 */
export function getJavaScriptFile() {
  const packageName = '@scalar/api-reference'

  const jsFilePath = 'dist/browser/standalone.js'

  const filePath = path.join(
    __dirname,
    '../../',
    'node_modules',
    packageName,
    jsFilePath,
  )

  return fs.readFileSync(filePath, 'utf8')
}
