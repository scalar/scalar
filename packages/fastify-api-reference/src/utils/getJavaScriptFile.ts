import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Read the JavaScript file.
 */
export function getJavaScriptFile() {
  // Get the directory name
  const dirname = path.dirname(fileURLToPath(import.meta.url))

  // Find the JavaScript file
  const filePath = [
    path.resolve(`${dirname}/js/standalone.js`),
    path.resolve(`${dirname}/../../dist/js/standalone.js`),
  ].find((file: string) => fs.existsSync(file))

  // Throw an error if the file is not found
  if (filePath === undefined) {
    throw new Error(
      `JavaScript file not found: ${path.resolve(
        `${dirname}/js/standalone.js`,
      )}`,
    )
  }

  return fs.readFileSync(filePath, 'utf8')
}
