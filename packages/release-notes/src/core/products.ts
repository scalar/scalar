import type { ReleaseNotesProduct } from '../config/types'
import { toWorkspaceRelativePath } from './paths'

/** Derive the sibling markdown path from a JSON output path. */
export const deriveMarkdownPath = (jsonPath: string): string => {
  return jsonPath.endsWith('.json') ? `${jsonPath.slice(0, -'.json'.length)}.md` : `${jsonPath}.md`
}

/**
 * Resolve a registered product from an on-disk release notes JSON path.
 */
export const findReleaseNotesProductByJsonPath = (
  jsonPath: string,
  products: readonly ReleaseNotesProduct[],
): ReleaseNotesProduct | undefined => {
  const normalized = toWorkspaceRelativePath(jsonPath)
  return products.find((product) => product.outputPath === normalized)
}
