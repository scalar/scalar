import { nodeExternals as RollupNodeExternals } from 'rollup-plugin-node-externals'
import type { Plugin } from 'vite'

/**
 * Here, to simplify, we use the existing rollup-plugin-node-externals plugin. It can exclude node dependencies and
 * will automatically exclude based on the dependencies and devDependencies in package.json. However, some minor
 * compatibility modifications for Vite are needed.
 */
export const nodeExternals = (): Plugin => {
  return {
    ...RollupNodeExternals(),
    name: 'node-externals',
    enforce: 'pre',
    apply: 'build',
  }
}
