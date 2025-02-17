import fs from 'node:fs'
import path from 'node:path'

// Get all SVG files from the icons directory
const iconsDir = path.join(new URL(import.meta.url).pathname, '../../src/icons')

const svgFiles = fs
  .readdirSync(iconsDir)
  .filter((file) => file.endsWith('.svg'))
  .map((file) => path.basename(file, '.svg'))

// Generate the Markdown table
const tableHeader = `| Icon | Name |
|------|------|`

const tableRows = svgFiles
  .map((iconName) => {
    return `| <span style="background: white; display: block; padding: 2px;"><img src="./src/icons/${iconName}.svg" style="display: block;"></span> | \`${iconName}\` |`
  })
  .join('\n')

const table = `${tableHeader}\n${tableRows}`

// Output
console.log(table)

// Update the README.md
const readmePath = path.join(new URL(import.meta.url).pathname, '../../README.md')
const readme = fs.readFileSync(readmePath, 'utf8')

const startMarker = '<!-- list-of-available-icons -->'
const endMarker = '<!-- /list-of-available-icons -->'

const newReadme = readme.replace(
  new RegExp(`${startMarker}[\\s\\S]*${endMarker}`),
  `${startMarker}\n\n${table}\n\n${endMarker}`,
)

fs.writeFileSync(readmePath, newReadme)
