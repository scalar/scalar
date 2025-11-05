/** biome-ignore-all lint/performance/noBarrelFile: entrypoint */
export { addPackageFileExports, findEntryPoints } from './helpers'

import { createRollupConfig } from './rollup'
import { ViteWatchWorkspace, alias, createViteBuildOptions } from './vite'

export {
  /** @deprecated import from '@scalar/build-tooling/vite' */
  alias,
  /** @deprecated import from '@scalar/build-tooling/vite' */
  createViteBuildOptions,
  /** @deprecated import from '@scalar/build-tooling/vite' */
  ViteWatchWorkspace,
  /** @deprecated import from '@scalar/build-tooling/rollup' */
  createRollupConfig,
}
