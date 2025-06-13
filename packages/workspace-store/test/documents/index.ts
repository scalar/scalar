import fs from 'node:fs'
import path from 'node:path'

export const yamlFiles = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.yaml'))
  .map((file) => {
    const filePath = path.join(__dirname, file)
    const content = fs.readFileSync(filePath, 'utf8')
    return {
      name: file,
      content,
    }
  })
