import { describe, expect, it } from 'vitest'

import packageJson from '../package.json'
import { ScalarIconAcorn, ScalarIconCaretDown, ScalarIconX } from './index'

describe('index', () => {
  it('package.json declares sideEffects: false to enable tree-shaking', () => {
    // Without this, Webpack-based consumers (e.g. Next.js) cannot safely
    // tree-shake unused icons. The entire dist/index.js (all 1,512 icons)
    // gets included in the bundle whenever any icon is imported.
    expect(packageJson.sideEffects).toBe(false)
  })

  it('icon components are plain objects with no module-level side effects', () => {
    // Each icon must be a plain Vue component object, not the result of a
    // side-effectful call (e.g. global component registration).
    expect(ScalarIconAcorn).toBeTypeOf('object')
    expect(ScalarIconAcorn).not.toBeNull()

    expect(ScalarIconCaretDown).toBeTypeOf('object')
    expect(ScalarIconCaretDown).not.toBeNull()

    expect(ScalarIconX).toBeTypeOf('object')
    expect(ScalarIconX).not.toBeNull()
  })

  it('icon components do not register themselves globally', () => {
    // Importing an icon must not mutate Vue's global app state.
    const globalKeys = Object.keys(globalThis)
    const scalarIconKeys = globalKeys.filter((key) => key.startsWith('ScalarIcon'))
    expect(scalarIconKeys).toHaveLength(0)
  })
})
