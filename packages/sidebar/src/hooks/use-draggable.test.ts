import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useDraggable } from './use-draggable'

describe('useDraggable', () => {
  it('initializes with default values', () => {
    const {
      draggableAttrs: draggableProps,
      draggingItem,
      hoveredItem,
    } = useDraggable({
      id: 'test-1',
      parentIds: [],
    })

    expect(draggingItem.value).toBeNull()
    expect(hoveredItem.value).toBeNull()
    expect(draggableProps.value.class).toBeUndefined()
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
      isDraggable: false,
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
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      isDraggable: true,
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
    const isDraggable = ref(true)
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      isDraggable,
    })

    expect(draggableProps.value.draggable).toBe(true)

    isDraggable.value = false
    expect(draggableProps.value.draggable).toBeUndefined()
  })

  it('does not set draggable attribute when isDraggable is false', () => {
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      isDraggable: false,
    })

    // When isDraggable is false, draggable should be undefined (not set)
    expect(draggableProps.value.draggable).toBeUndefined()
  })

  it('does not set class attribute when draggableClass is empty', () => {
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
    })

    // When there's no hover, draggableClass returns empty string, which becomes undefined
    expect(draggableProps.value.class).toBeUndefined()
  })

  it('does not set class attribute when draggableClass is falsy', () => {
    const { draggableAttrs: draggableProps } = useDraggable({
      id: 'test-1',
      parentIds: [],
      isDraggable: false,
    })

    // When there's no hover and isDraggable is false, class should still be undefined
    expect(draggableProps.value.class).toBeUndefined()
  })
})
