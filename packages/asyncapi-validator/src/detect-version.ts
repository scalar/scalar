import { isObject } from '@scalar/helpers/object/is-object'

import { type AsyncApiVersion, AsyncApiVersions } from '@/specifications'

/**
 * Detects the AsyncAPI version of a document by reading its top-level `asyncapi`
 * field (a version string like `"3.0.0"`).
 *
 * We keep one schema per minor version, so any patch release validates against
 * its minor: `3.1.4` is checked against the `3.1.0` schema. Returns the matching
 * supported version, or `undefined` when none exists.
 */
export function detectVersion(document: unknown): AsyncApiVersion | undefined {
  if (!isObject(document)) {
    return undefined
  }

  const version = document.asyncapi

  if (typeof version !== 'string') {
    return undefined
  }

  // Exact match first (the common case).
  if ((AsyncApiVersions as string[]).includes(version)) {
    return version as AsyncApiVersion
  }

  // Otherwise fall back to the schema for the same major.minor.
  const [major, minor] = version.split('.')

  return AsyncApiVersions.find((supported) => {
    const [supportedMajor, supportedMinor] = supported.split('.')

    return supportedMajor === major && supportedMinor === minor
  })
}
