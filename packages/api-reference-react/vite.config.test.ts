import { describe, expect, it } from 'vitest'

import config from './vite.config'

describe('vite.config', () => {
  it('marks the Vue bundler flag module as side-effectful', () => {
    const treeshake = config.build?.rolldownOptions?.treeshake

    if (!treeshake || typeof treeshake === 'boolean' || !('moduleSideEffects' in treeshake)) {
      throw new Error('Expected treeshake.moduleSideEffects to exist in vite config')
    }

    const { moduleSideEffects } = treeshake

    if (typeof moduleSideEffects !== 'function') {
      throw new Error('Expected treeshake.moduleSideEffects to be a function')
    }

    expect(moduleSideEffects('/virtual/src/style.css', false)).toBe(true)
    expect(moduleSideEffects('/virtual/src/vue-bundler-flags.ts', false)).toBe(true)
    expect(moduleSideEffects('/virtual/src/some-other-module.ts', false)).toBe(false)
  })
})
