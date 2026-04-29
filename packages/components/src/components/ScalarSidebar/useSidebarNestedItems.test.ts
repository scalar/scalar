import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type ComputedRef, computed, inject, nextTick, ref } from 'vue'

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

describe('useSidebarNestedItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('syncs the open state of the nearest nested child items', async () => {
    const childModel = ref(false)
    const childOpen = computed(() => childModel.value)
    const parentModel = ref<ComputedRef<boolean>[]>([])
    const open = computed(() => parentModel.value.some((child) => child.value))

    vi.mocked(inject).mockReturnValue(parentModel)

    // Should not sync before the hook is used
    childModel.value = true
    await nextTick()
    expect(open.value).toEqual(false)

    childModel.value = false
    await nextTick()
    expect(open.value).toEqual(false)

    useSidebarNestedItem(childOpen)

    childModel.value = true
    await nextTick()
    expect(open.value).toEqual(true)

    childModel.value = false
    await nextTick()
    expect(open.value).toEqual(false)
  })

  it('syncs multiple child models', async () => {
    const childModel1 = ref(false)
    const childModel2 = ref(false)
    const parentModel = ref<ComputedRef<boolean>[]>([])
    const open = computed(() => parentModel.value.some((child) => child.value))

    vi.mocked(inject).mockReturnValue(parentModel)

    useSidebarNestedItem(computed(() => childModel1.value))
    useSidebarNestedItem(computed(() => childModel2.value))

    childModel1.value = true
    await nextTick()
    expect(open.value).toEqual(true)

    childModel2.value = true
    await nextTick()
    expect(open.value).toEqual(true)

    childModel1.value = false
    await nextTick()
    expect(open.value).toEqual(true)

    childModel2.value = false
    await nextTick()
    expect(open.value).toEqual(false)
  })
})
