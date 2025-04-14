import { readdirSync, writeFile } from 'node:fs'
import { join } from 'node:path'

/**
 * Generate type from the icon file names
 * We are actually generating an array as well for easier consumption in storybook
 */
function generateTypes(folder: string, name: 'LOGOS' | 'ICONS') {
  const indexFile = join(folder, 'index.ts')

  const svgRegex = /\.svg$/
  const fileNames = readdirSync(folder)
    .filter((fileName) => svgRegex.test(fileName))
    .sort() // Sort filenames to ensure consistent order across OS

  // Write icons to a typescript file for exporting
  let writeStr = `export const ${name} = [\n`
  fileNames.forEach((fileName) => {
    const icon = fileName.replace(svgRegex, '')
    writeStr += `  '${icon}',\n`
  })
  writeStr += '] as const\n'

  writeFile(indexFile, writeStr, (err) => {
    if (err) {
      console.error(err)
    } else {
      console.log(`Success! Check for the icon names in ${indexFile}`)
    }
  })
}

generateTypes('./src/components/ScalarIcon/icons/', 'ICONS')
generateTypes('./src/components/ScalarIcon/logos/', 'LOGOS')
