import { path } from '@scalar/helpers/node/path'

import { isRemoteUrl } from '@/helpers/is-remote-url'

const getDirectory = (input: string) => {
  if (path.extname(input) !== '') {
    return path.dirname(input)
  }
  return input
}

export const transformToRelative = (input: string, base: string) => {
  if (isRemoteUrl(input) && isRemoteUrl(base)) {
    const inputUrl = new URL(input)
    const baseUrl = new URL(base)
    if (inputUrl.origin !== baseUrl.origin) {
      console.warn(`Input URL "${input}" is not in the same origin as base URL "${base}". Returning input as is.`)
      return input
    }

    // Get the directory of the base URL pathname (not the file itself)
    const baseDir = getDirectory(path.resolve(baseUrl.pathname))
    const inputPath = path.resolve(inputUrl.pathname)
    return path.relative(baseDir, inputPath)
  }

  if (isRemoteUrl(base)) {
    const baseUrl = new URL(base)
    const baseDir = getDirectory(path.resolve(baseUrl.pathname))
    const inputPath = path.resolve(input)
    baseUrl.pathname = path.relative(baseDir, inputPath)
    return baseUrl.toString()
  }

  if (isRemoteUrl(input)) {
    return input
  }

  // Get the directory of the base file path (not the file itself)
  const baseDir = getDirectory(path.resolve(base))
  const inputPath = path.resolve(input)
  return path.relative(baseDir, inputPath)
}
