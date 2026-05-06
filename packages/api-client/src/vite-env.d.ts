declare global {
  /** The version number taken from the package.json */
  const PACKAGE_VERSION: string
  /** The version number taken from the package.json to override the package version (e.g. for seprate deployment flow) */
  const OVERRIDE_PACKAGE_VERSION: string | undefined
}

// Needed to fake a module when declaring :)
export {}
