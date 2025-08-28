/** Get the latest npm version of a package. Fallbacks to the current version if the fetch fails */
export async function latestVersion(packageName: string, current: string) {
  return fetch(`https://registry.npmjs.org/${packageName}/latest`)
    .then((res: any) => res.json())
    .then((data: any) => ({
      error: '',
      version: data.version,
    }))
    .catch((err: any) => ({
      error: `Failed to fetch latest version for ${packageName}: ${err.message}`,
      version: current,
    }))
}
