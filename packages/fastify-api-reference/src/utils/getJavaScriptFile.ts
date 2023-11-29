import fs from 'fs'
import path from 'path'

/**
 * Read the JavaScript file.
 */
export function getJavaScriptFile() {
  return fs.readFileSync(
    path.resolve(`${__dirname}/../../dist/js/standalone.js`),
    'utf8',
  )
}
