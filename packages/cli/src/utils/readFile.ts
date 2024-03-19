import fs from 'node:fs'

export function readFile(file: string) {
  try {
    if (fs.existsSync(file) === false) {
      return undefined
    }

    return fs.readFileSync(file, 'utf8')
  } catch (err) {
    console.error(err)

    return undefined
  }
}
