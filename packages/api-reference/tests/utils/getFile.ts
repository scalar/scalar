import fs from 'fs'

export const getFile = (file: string) => {
  return fs.readFileSync(file, 'utf8')
}
