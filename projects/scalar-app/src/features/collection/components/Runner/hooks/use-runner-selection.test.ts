import { describe, expect, it, vi } from 'vitest'

import { type SelectedItem, useRunnerSelection } from './use-runner-selection'

const createMockItem = (overrides: Partial<SelectedItem> = {}): SelectedItem => ({
  id: '/pets|get|default',
  path: '/pets',
  method: 'get',
  exampleKey: 'default',
  label: 'GET /pets — default',
  ...overrides,
})

const createMockDragEvent = (overrides: Partial<DragEvent> = {}): DragEvent => {
  const event = {
    preventDefault: vi.fn(),
    dataTransfer: {
      effectAllowed: '',
      setData: vi.fn(),
    },
    currentTarget: {
      getBoundingClientRect: () => ({ top: 0, height: 100 }),
    },
    clientY: 50,
    ...overrides,
  } as unknown as DragEvent
  return event
}

const createHook = (isLocked = false) => {
  return useRunnerSelection({
    isLocked: () => isLocked,
  })
}

describe('useRunnerSelection', () => {
  describe('initial state', () => {
    it('initializes with empty selection', () => {
      const hook = createHook()

      expect(hook.selectedOrder.value).toEqual([])
      expect(hook.hasSelection.value).toBe(false)
    })

    it('initializes with null drag state', () => {
      const hook = createHook()

      expect(hook.dragState.draggedIndex.value).toBe(null)
      expect(hook.dragState.dragOverIndex.value).toBe(null)
      expect(hook.dragState.dragOffset.value).toBe(null)
    })
  })

  describe('isSelected', () => {
    it('returns false when item is not selected', () => {
      const hook = createHook()

      expect(hook.isSelected('/pets', 'get', 'default')).toBe(false)
    })

    it('returns true when item is selected', () => {
      const hook = createHook()
      hook.toggle('/pets', 'get', 'default', 'GET /pets')

      expect(hook.isSelected('/pets', 'get', 'default')).toBe(true)
    })

    it('matches all three fields', () => {
      const hook = createHook()
      hook.toggle('/pets', 'get', 'default', 'GET /pets')

      expect(hook.isSelected('/pets', 'get', 'default')).toBe(true)
      expect(hook.isSelected('/pets', 'post', 'default')).toBe(false)
      expect(hook.isSelected('/pets', 'get', 'other')).toBe(false)
      expect(hook.isSelected('/users', 'get', 'default')).toBe(false)
    })
  })

  describe('toggle', () => {
    it('adds item when not selected', () => {
      const hook = createHook()

      hook.toggle('/pets', 'get', 'default', 'GET /pets')

      expect(hook.selectedOrder.value).toHaveLength(1)
      expect(hook.selectedOrder.value[0]).toMatchObject({
        id: '/pets|get|default',
        path: '/pets',
        method: 'get',
        exampleKey: 'default',
        label: 'GET /pets',
      })
    })

    it('removes item when already selected', () => {
      const hook = createHook()
      hook.toggle('/pets', 'get', 'default', 'GET /pets')

      hook.toggle('/pets', 'get', 'default', 'GET /pets')

      expect(hook.selectedOrder.value).toHaveLength(0)
    })

    it('does nothing when locked', () => {
      const hook = createHook(true)

      hook.toggle('/pets', 'get', 'default', 'GET /pets')

      expect(hook.selectedOrder.value).toHaveLength(0)
    })

    it('preserves order when adding multiple items', () => {
      const hook = createHook()

      hook.toggle('/pets', 'get', 'default', 'GET /pets')
      hook.toggle('/users', 'post', 'default', 'POST /users')
      hook.toggle('/items', 'delete', 'default', 'DELETE /items')

      expect(hook.selectedOrder.value).toHaveLength(3)
      expect(hook.selectedOrder.value[0]?.path).toBe('/pets')
      expect(hook.selectedOrder.value[1]?.path).toBe('/users')
      expect(hook.selectedOrder.value[2]?.path).toBe('/items')
    })
  })

  describe('hasSelection', () => {
    it('returns false when empty', () => {
      const hook = createHook()

      expect(hook.hasSelection.value).toBe(false)
    })

    it('returns true when items selected', () => {
      const hook = createHook()
      hook.toggle('/pets', 'get', 'default', 'GET /pets')

      expect(hook.hasSelection.value).toBe(true)
    })

    it('returns false after clearing', () => {
      const hook = createHook()
      hook.toggle('/pets', 'get', 'default', 'GET /pets')
      hook.clearAll()

      expect(hook.hasSelection.value).toBe(false)
    })
  })

  describe('clearAll', () => {
    it('removes all selected items', () => {
      const hook = createHook()
      hook.toggle('/pets', 'get', 'default', 'GET /pets')
      hook.toggle('/users', 'post', 'default', 'POST /users')

      hook.clearAll()

      expect(hook.selectedOrder.value).toHaveLength(0)
    })

    it('does nothing when locked', () => {
      const hook = createHook(true)
      hook.selectedOrder.value = [createMockItem()]

      hook.clearAll()

      expect(hook.selectedOrder.value).toHaveLength(1)
    })
  })

  describe('removeFromOrder', () => {
    it('removes specific item by id', () => {
      const hook = createHook()
      hook.toggle('/pets', 'get', 'default', 'GET /pets')
      hook.toggle('/users', 'post', 'default', 'POST /users')

      hook.removeFromOrder(hook.selectedOrder.value[0]!)

      expect(hook.selectedOrder.value).toHaveLength(1)
      expect(hook.selectedOrder.value[0]?.path).toBe('/users')
    })

    it('does nothing when locked', () => {
      const hook = createHook(true)
      const item = createMockItem()
      hook.selectedOrder.value = [item]

      hook.removeFromOrder(item)

      expect(hook.selectedOrder.value).toHaveLength(1)
    })

    it('does nothing when item not found', () => {
      const hook = createHook()
      hook.toggle('/pets', 'get', 'default', 'GET /pets')

      hook.removeFromOrder(createMockItem({ id: 'nonexistent' }))

      expect(hook.selectedOrder.value).toHaveLength(1)
    })
  })

  describe('handleDragStart', () => {
    it('sets draggedIndex', () => {
      const hook = createHook()
      const event = createMockDragEvent()

      hook.handleDragStart(2, event)

      expect(hook.dragState.draggedIndex.value).toBe(2)
    })

    it('sets dataTransfer properties', () => {
      const hook = createHook()
      const event = createMockDragEvent()

      hook.handleDragStart(2, event)

      expect(event.dataTransfer?.effectAllowed).toBe('move')
      expect(event.dataTransfer?.setData).toHaveBeenCalledWith('text/plain', '2')
    })

    it('prevents default and does nothing when locked', () => {
      const hook = createHook(true)
      const event = createMockDragEvent()

      hook.handleDragStart(2, event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(hook.dragState.draggedIndex.value).toBe(null)
    })
  })

  describe('handleDragOver', () => {
    it('sets dragOverIndex and offset when dragging over different item', () => {
      const hook = createHook()
      hook.dragState.draggedIndex.value = 0

      const event = createMockDragEvent({ clientY: 25 })
      hook.handleDragOver(1, event)

      expect(hook.dragState.dragOverIndex.value).toBe(1)
      expect(hook.dragState.dragOffset.value).toBe('before')
    })

    it('sets offset to after when below midpoint', () => {
      const hook = createHook()
      hook.dragState.draggedIndex.value = 0

      const event = createMockDragEvent({ clientY: 75 })
      hook.handleDragOver(1, event)

      expect(hook.dragState.dragOffset.value).toBe('after')
    })

    it('clears state when dragging over same item', () => {
      const hook = createHook()
      hook.dragState.draggedIndex.value = 1
      hook.dragState.dragOverIndex.value = 0
      hook.dragState.dragOffset.value = 'before'

      const event = createMockDragEvent()
      hook.handleDragOver(1, event)

      expect(hook.dragState.dragOverIndex.value).toBe(null)
      expect(hook.dragState.dragOffset.value).toBe(null)
    })

    it('clears state when not dragging', () => {
      const hook = createHook()

      const event = createMockDragEvent()
      hook.handleDragOver(1, event)

      expect(hook.dragState.dragOverIndex.value).toBe(null)
      expect(hook.dragState.dragOffset.value).toBe(null)
    })
  })

  describe('handleDrop', () => {
    it('reorders items when dropping before target', () => {
      const hook = createHook()
      hook.toggle('/a', 'get', 'default', 'A')
      hook.toggle('/b', 'get', 'default', 'B')
      hook.toggle('/c', 'get', 'default', 'C')

      hook.dragState.draggedIndex.value = 2
      hook.dragState.dragOverIndex.value = 0
      hook.dragState.dragOffset.value = 'before'

      const event = createMockDragEvent()
      hook.handleDrop(event)

      expect(hook.selectedOrder.value[0]?.path).toBe('/c')
      expect(hook.selectedOrder.value[1]?.path).toBe('/a')
      expect(hook.selectedOrder.value[2]?.path).toBe('/b')
    })

    it('reorders items when dropping after target', () => {
      const hook = createHook()
      hook.toggle('/a', 'get', 'default', 'A')
      hook.toggle('/b', 'get', 'default', 'B')
      hook.toggle('/c', 'get', 'default', 'C')

      hook.dragState.draggedIndex.value = 0
      hook.dragState.dragOverIndex.value = 2
      hook.dragState.dragOffset.value = 'after'

      const event = createMockDragEvent()
      hook.handleDrop(event)

      expect(hook.selectedOrder.value[0]?.path).toBe('/b')
      expect(hook.selectedOrder.value[1]?.path).toBe('/c')
      expect(hook.selectedOrder.value[2]?.path).toBe('/a')
    })

    it('resets drag state after drop', () => {
      const hook = createHook()
      hook.toggle('/a', 'get', 'default', 'A')
      hook.toggle('/b', 'get', 'default', 'B')

      hook.dragState.draggedIndex.value = 0
      hook.dragState.dragOverIndex.value = 1
      hook.dragState.dragOffset.value = 'after'

      const event = createMockDragEvent()
      hook.handleDrop(event)

      expect(hook.dragState.draggedIndex.value).toBe(null)
      expect(hook.dragState.dragOverIndex.value).toBe(null)
      expect(hook.dragState.dragOffset.value).toBe(null)
    })

    it('does nothing when drag state is incomplete', () => {
      const hook = createHook()
      hook.toggle('/a', 'get', 'default', 'A')
      hook.toggle('/b', 'get', 'default', 'B')

      hook.dragState.draggedIndex.value = 0
      hook.dragState.dragOverIndex.value = null

      const event = createMockDragEvent()
      hook.handleDrop(event)

      expect(hook.selectedOrder.value[0]?.path).toBe('/a')
      expect(hook.selectedOrder.value[1]?.path).toBe('/b')
    })
  })

  describe('handleDragEnd', () => {
    it('resets all drag state', () => {
      const hook = createHook()
      hook.dragState.draggedIndex.value = 1
      hook.dragState.dragOverIndex.value = 2
      hook.dragState.dragOffset.value = 'before'

      hook.handleDragEnd()

      expect(hook.dragState.draggedIndex.value).toBe(null)
      expect(hook.dragState.dragOverIndex.value).toBe(null)
      expect(hook.dragState.dragOffset.value).toBe(null)
    })
  })

  describe('handleDragLeave', () => {
    it('does not clear drag state to prevent flickering', () => {
      const hook = createHook()
      hook.dragState.draggedIndex.value = 1
      hook.dragState.dragOverIndex.value = 2
      hook.dragState.dragOffset.value = 'before'

      hook.handleDragLeave()

      expect(hook.dragState.dragOverIndex.value).toBe(2)
      expect(hook.dragState.dragOffset.value).toBe('before')
    })
  })
})
