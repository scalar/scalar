import path from 'pathe'

const hasScheme = (value: string): boolean => /^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[a-z]:[\\/]/i.test(value)

/**
 * Resolves a reference path by combining a base path with a relative path.
 * Scheme-bearing references keep their identity, including non-fetchable URNs.
 * Hierarchical URI bases use URL resolution (query, fragment, and directory semantics);
 * an opaque base such as a URN cannot resolve a relative path and throws.
 * Scheme-less inputs retain filesystem resolution, including Windows drive paths.
 *
 * @param base - The base path (can be a URL or local file path)
 * @param relativePath - The relative path to resolve against the base
 * @returns The resolved absolute path
 * @example
 * // Resolve remote URL
 * resolveReferencePath('https://example.com/api/schema.json', 'user.json')
 * // Returns: 'https://example.com/api/user.json'
 *
 * // Resolve local path
 * resolveReferencePath('/path/to/schema.json', 'user.json')
 * // Returns: '/path/to/user.json'
 */
export const resolveReferencePath = (base: string, relativePath: string): string => {
  if (hasScheme(relativePath)) {
    return relativePath
  }

  if (hasScheme(base)) {
    return new URL(relativePath, base).href
  }

  if (!relativePath) {
    return base
  }

  const directory = /[\\/]$/.test(base) ? base : path.dirname(base)
  const resolved = path.resolve(directory, relativePath)
  return /[\\/]$/.test(relativePath) && !resolved.endsWith('/') ? `${resolved}/` : resolved
}
