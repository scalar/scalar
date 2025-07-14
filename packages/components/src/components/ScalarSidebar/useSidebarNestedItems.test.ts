import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, inject, nextTick, ref, type Ref } from 'vue'
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

  it('should sync the open state of the nearest nested child items', async () => {
    const childModel = ref(false)
    const parentModel = ref<Ref<boolean>[]>([])
    const open = computed(() => parentModel.value.some((child) => child.value))

    vi.mocked(inject).mockReturnValue(parentModel)

    // Shouldn't sync before the hook is used
    childModel.value = true
    await nextTick()
    expect(open.value).toEqual(false) // Not synced yet

    childModel.value = false
    await nextTick()
    expect(open.value).toEqual(false) // Not synced yet

    useSidebarNestedItem(childModel)

    childModel.value = true
    await nextTick()
    expect(open.value).toEqual(true) // Synced

    childModel.value = false
    await nextTick()
    expect(open.value).toEqual(false) // Synced
  })

  it('should sync multiple child models', async () => {
    const childModel1 = ref(false)
    const childModel2 = ref(false)
    const parentModel = ref<Ref<boolean>[]>([])
    const open = computed(() => parentModel.value.some((child) => child.value))

    vi.mocked(inject).mockReturnValue(parentModel)

    useSidebarNestedItem(childModel1)
    useSidebarNestedItem(childModel2)

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
