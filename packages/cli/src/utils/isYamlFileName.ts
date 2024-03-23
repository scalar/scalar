import { isUrl } from './isUrl'

/**
 * True for all files ending with .yml or .yaml (case-insensitive).
 */
export function isYamlFileName(fileName: string) {
  if (isUrl(fileName)) {
    return false
  }

  return /\.ya?ml$/i.test(fileName)
}
