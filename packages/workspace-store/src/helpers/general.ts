import fs from 'node:fs/promises'

export type UnknownObject = Record<string, unknown>

/**
 * Returns true if the value is a non-null object (but not an array).
 *
 * @example
 * ```ts
 * isObject({}) // true
 * isObject([]) // false
 * isObject(null) // false
 * ```
 */
export function isObject(value: unknown): value is UnknownObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Checks whether a json ref is a remote ref
 */
export function isRemoteRef(value: string) {
  return value.startsWith('http')
}

/**
 * Check if a json pointer is a local ref
 */
export function isLocalRef(value: string) {
  return value.startsWith('#/')
}

/**
 * Check if a json pointer is a filesystem ref
 */
export function isFileSystemRef(value: string) {
  return !isRemoteRef(value) && !isLocalRef(value)
}

async function resolveRemoteRef(value: string): Promise<{ ok: true; data: unknown } | { ok: false }> {
  const response = await fetch(value)

  if (response.ok) {
    const body = await response.json()
    return { ok: true, data: body }
  }

  return { ok: false }
}

async function resolveFilesystemRef(value: string): Promise<{ ok: true; data: unknown } | { ok: false }> {
  try {
    const contents = await fs.readFile(value, 'utf-8')

    return { ok: true, data: JSON.parse(contents) }
  } catch {
    return { ok: false }
  }
}

export async function resolveRef(value: string) {
  if (isRemoteRef(value)) {
    return resolveRemoteRef(value)
  }

  if (isFileSystemRef(value)) {
    return resolveFilesystemRef(value)
  }

  return { ok: false } as const
}
