import fs from 'fs'
import path from 'path'

/**
 * Read the JavaScript file.
 */
export function getJavaScriptFile() {
  const filePath = [
    path.resolve(`${__dirname}/js/standalone.js`),
    path.resolve(`${__dirname}/../../dist/js/standalone.js`),
  ].find((file: string) => fs.existsSync(file))

  if (filePath === undefined) {
    throw new Error(
      `JavaScript file not found: ${path.resolve(
        `${__dirname}/js/standalone.js`,
      )}`,
    )
  }

  return fs.readFileSync(filePath, 'utf8')
}
