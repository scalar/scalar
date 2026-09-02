import { describe, expect, it } from 'vitest'
import { reactive, ref } from 'vue'

import { useSchemaLayout } from './use-schema-layout'

describe('use-schema-layout', () => {
  it('reports the tree layout from a plain value', () => {
    expect(useSchemaLayout('tree').isTreeLayout.value).toBe(true)
    expect(useSchemaLayout('legacy').isTreeLayout.value).toBe(false)
  })

  it('treats an undefined layout as not the tree', () => {
    expect(useSchemaLayout(undefined).isTreeLayout.value).toBe(false)
  })

  it('follows a ref as it changes', () => {
    const layout = ref<'legacy' | 'tree' | undefined>('legacy')
    const { isTreeLayout } = useSchemaLayout(layout)

    expect(isTreeLayout.value).toBe(false)

    layout.value = 'tree'

    expect(isTreeLayout.value).toBe(true)
  })

  it('follows a getter over reactive options', () => {
    const options = reactive<{ schemaLayout: 'legacy' | 'tree' | undefined }>({
      schemaLayout: undefined,
    })
    const { isTreeLayout } = useSchemaLayout(() => options.schemaLayout)

    expect(isTreeLayout.value).toBe(false)

    options.schemaLayout = 'tree'

    expect(isTreeLayout.value).toBe(true)

    options.schemaLayout = 'legacy'

    expect(isTreeLayout.value).toBe(false)
  })
})
