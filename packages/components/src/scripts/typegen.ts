import { readdirSync, writeFile } from 'fs'

/**
 * Generate type from the icon file names
 * We are actually generating an array as well for easier consumption in storybook
 */
const iconFolder = './src/components/ScalarIcon/icons/'
const iconsFile = './src/components/ScalarIcon/icons/iconNames.ts'
const svgRegex = /\.svg$/
const fileNames = readdirSync(iconFolder).filter((fileName) =>
  svgRegex.test(fileName),
)

// Write icons to a typescript file for exporting
let writeStr = 'export const iconNames = [\n'
fileNames.forEach((fileName, index) => {
  const icon = fileName.replace(svgRegex, '')
  const comma = index < fileNames.length - 1 ? ',' : ''

  writeStr += `  '${icon}'${comma}\n`
})
writeStr += ']'

writeFile(iconsFile, writeStr, (err) => {
  if (err) console.error(err)
  else console.log(`Success! Check for the icon names in ${iconsFile}`)
})
