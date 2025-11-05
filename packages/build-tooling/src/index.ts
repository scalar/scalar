/** biome-ignore-all lint/performance/noBarrelFile: entrypoint */
export { addPackageFileExports, findEntryPoints } from './helpers'

import { createRollupConfig } from './rollup'
import { ViteWatchWorkspace, alias, autoCSSInject, createViteBuildOptions } from './vite'

export {
  autoCSSInject,
  /** @deprecated import from '@scalar/build-tooling/vite' */
  alias,
  /** @deprecated import from '@scalar/build-tooling/vite' */
  createViteBuildOptions,
  /** @deprecated import from '@scalar/build-tooling/vite' */
  ViteWatchWorkspace,
  /** @deprecated import from '@scalar/build-tooling/rollup' */
  createRollupConfig,
}
