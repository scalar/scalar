/**
 * Get the latest npm version of a package.
 * Fallbacks to the current version if the fetch fails.
 */
export async function latestVersion(packageName: string, current: string): Promise<{ error: string; version: string }> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`)
    const data = await res.json()

    return {
      error: '',
      version: data.version,
    }
  } catch (err) {
    return {
      error: `Failed to fetch latest version for ${packageName}: ${(err as Error).message}`,
      version: current,
    }
  }
}
