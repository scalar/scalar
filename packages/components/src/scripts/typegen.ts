import { readdirSync, writeFile } from 'fs'

/**
 * Generate type from the icon file names
 * We are actually generating an array as well for easier consumption in storybook
 */
const iconFolder = './src/components/ScalarIcon/icons/'
const iconsFile = './src/components/ScalarIcon/icons/icons.ts'
const svgRegex = /\.svg$/
const fileNames = readdirSync(iconFolder).filter((fileName) =>
  svgRegex.test(fileName),
)

// Write icons to a typescript file for exporting
let writeStr = 'export const ICONS = [\n'
fileNames.forEach((fileName) => {
  const icon = fileName.replace(svgRegex, '')
  writeStr += `  '${icon}',\n`
})
writeStr += '] as const\n'

writeFile(iconsFile, writeStr, (err) => {
  if (err) console.error(err)
  else console.log(`Success! Check for the icon names in ${iconsFile}`)
})
