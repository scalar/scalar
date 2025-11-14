import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useDraggable } from './use-draggable'

describe('useDraggable', () => {
  it('initializes with default values', () => {
    const { draggableProps, draggingItem, hoveredItem } = useDraggable({
      id: 'test-1',
      parentIds: [],
    })

    expect(draggingItem.value).toBeNull()
    expect(hoveredItem.value).toBeNull()
    expect(draggableProps.value.class).toBe('sidebar-indent-nested')
    expect(draggableProps.value.draggable).toBe(true)
  })

  it('handles drag start', () => {
    const onDragStart = vi.fn()
    const { draggableEvents } = useDraggable({
      id: 'test-1',
      parentIds: [],
      onDragStart,
    })

    const mockEvent = {
      dataTransfer: {
        dropEffect: '',
        effectAllowed: '',
      },
      target: document.createElement('div'),
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent

    draggableEvents.dragstart(mockEvent)

    expect(onDragStart).toHaveBeenCalledWith({
      id: 'test-1',
      parentId: null,
    })
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
  })

  it('does not start drag if enabled is false', () => {
    const onDragStart = vi.fn()
    const { draggableEvents } = useDraggable({
      id: 'test-1',
      parentIds: [],
      enabled: false,
      onDragStart,
    })

    const mockEvent = {
      dataTransfer: {
        dropEffect: '',
        effectAllowed: '',
      },
      target: document.createElement('div'),
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent

    draggableEvents.dragstart(mockEvent)

    expect(onDragStart).not.toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
  })

  it('returns draggableProps with correct structure', () => {
    const { draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      enabled: true,
    })

    expect(draggableProps.value).toHaveProperty('class')
    expect(draggableProps.value).toHaveProperty('draggable')
    expect(draggableProps.value.draggable).toBe(true)
  })

  it('returns draggableEvents with all required handlers', () => {
    const { draggableEvents } = useDraggable({
      id: 'test-1',
      parentIds: [],
    })

    expect(draggableEvents).toHaveProperty('dragend')
    expect(draggableEvents).toHaveProperty('dragover')
    expect(draggableEvents).toHaveProperty('dragstart')
    expect(typeof draggableEvents.dragend).toBe('function')
    expect(typeof draggableEvents.dragover).toBe('function')
    expect(typeof draggableEvents.dragstart).toBe('function')
  })

  it('updates draggable prop when enabled changes', () => {
    const enabled = ref(true)
    const { draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      enabled,
    })

    expect(draggableProps.value.draggable).toBe(true)

    enabled.value = false
    expect(draggableProps.value.draggable).toBe(false)
  })
})
