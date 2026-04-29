import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, inject, nextTick, ref, shallowReactive } from 'vue'

import { useSidebarNestedItem } from './useSidebarNestedItems'

// Mock vue's inject/provide
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    inject: vi.fn(),
    provide: vi.fn(),
  }
})

const createParentModel = () => {
  const parentModel = shallowReactive(new Set<() => boolean>())
  const open = computed(() => {
    for (const child of parentModel) {
      if (child()) {
        return true
      }
    }

    return false
  })

  return {
    parentModel,
    open,
  }
}

describe('useSidebarNestedItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('syncs the open state of the nearest nested child items', async () => {
    const childModel = ref(false)
    const childOpen = () => childModel.value
    const { parentModel, open } = createParentModel()

    vi.mocked(inject).mockReturnValue(parentModel)

    // Should not sync before the hook is used
    childModel.value = true
    await nextTick()
    expect(open.value).toBe(false)

    childModel.value = false
    await nextTick()
    expect(open.value).toBe(false)

    useSidebarNestedItem(childOpen)

    childModel.value = true
    await nextTick()
    expect(open.value).toBe(true)

    childModel.value = false
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('syncs multiple child models', async () => {
    const childModel1 = ref(false)
    const childModel2 = ref(false)
    const { parentModel, open } = createParentModel()

    vi.mocked(inject).mockReturnValue(parentModel)

    useSidebarNestedItem(() => childModel1.value)
    useSidebarNestedItem(() => childModel2.value)

    childModel1.value = true
    await nextTick()
    expect(open.value).toBe(true)

    childModel2.value = true
    await nextTick()
    expect(open.value).toBe(true)

    childModel1.value = false
    await nextTick()
    expect(open.value).toBe(true)

    childModel2.value = false
    await nextTick()
    expect(open.value).toBe(false)
  })
})
