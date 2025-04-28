export { findEntryPoints, addPackageFileExports, alias } from './helpers'
import { createRollupConfig } from './rollup'
import { createViteBuildOptions, autoCSSInject } from './vite'
import { ViteWatchWorkspace } from './vite/plugins'

export {
  /** @deprecated import from '@scalar/build-tooling/vite' */
  createViteBuildOptions,
  /** @deprecated import from '@scalar/build-tooling/vite' */
  ViteWatchWorkspace,
  /** @deprecated import from '@scalar/build-tooling/rollup' */
  createRollupConfig,
  autoCSSInject,
}
