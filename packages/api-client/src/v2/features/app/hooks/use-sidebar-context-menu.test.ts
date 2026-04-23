import type { SidebarState } from '@scalar/sidebar'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { useSidebarContextMenu } from '@/v2/features/app/hooks/use-sidebar-context-menu'

/**
 * Minimal tree covering the entry shapes the hook reads: a document that
 * contains a tag, an operation, and an example. Each entry points back to
 * its parent so `getParentEntry('document' | 'operation', …)` resolves in
 * the same way it would inside the real workspace store.
 */
const buildTree = () => {
  const document = {
    id: 'doc-1',
    type: 'document',
    name: 'pets',
    title: 'Pets',
  } as unknown as TraversedEntry

  const tag = {
    id: 'tag-1',
    type: 'tag',
    name: 'Pets',
    title: 'Pets',
    parent: document,
  } as unknown as TraversedEntry

  const operation = {
    id: 'op-1',
    type: 'operation',
    method: 'get',
    path: '/pets',
    title: 'List pets',
    parent: document,
  } as unknown as TraversedEntry

  const example = {
    id: 'ex-1',
    type: 'example',
    name: 'default',
    title: 'default',
    parent: operation,
  } as unknown as TraversedEntry

  return { document, tag, operation, example }
}

/**
 * Fake `SidebarState` that just looks entries up by id. The real state
 * implementation does the same thing — it's a `Map` under the hood — but
 * building the full state machine here would pull in unrelated selection
 * / expansion logic the hook does not use.
 */
const createFakeSidebarState = (
  entries: TraversedEntry[],
): SidebarState<TraversedEntry> => {
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  return {
    getEntryById: (id: string) => byId.get(id),
  } as unknown as SidebarState<TraversedEntry>
}

const setup = () => {
  const tree = buildTree()
  const eventBus = createWorkspaceEventBus({ debug: false })
  const sidebarState = createFakeSidebarState([
    tree.document,
    tree.tag,
    tree.operation,
    tree.example,
  ])

  const hook = useSidebarContextMenu({ eventBus, sidebarState })

  return { ...hook, eventBus, tree }
}

describe('use-sidebar-context-menu', () => {
  it('starts with no menu target and a hidden delete modal', () => {
    const { menuTarget, deleteModalState } = setup()

    expect(menuTarget.value).toBeNull()
    expect(deleteModalState.open).toBe(false)
  })

  it('openMenu stores the clicked entry and anchor element', async () => {
    const { menuTarget, openMenu, tree } = setup()
    const el = document.createElement('button')
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', { value: el })

    await openMenu(event, tree.operation)

    expect(menuTarget.value?.item.id).toBe('op-1')
    expect(menuTarget.value?.el).toBe(el)
    expect(menuTarget.value?.showMenu).toBe(true)
  })

  it('openMenu re-dispatches the triggering event on the anchor', async () => {
    const { openMenu, tree } = setup()
    const el = document.createElement('button')
    const listener = vi.fn()
    el.addEventListener('click', listener)

    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', { value: el })

    await openMenu(event, tree.operation)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('openMenu is a no-op when a menu is already showing', async () => {
    const { menuTarget, openMenu, tree } = setup()
    const el1 = document.createElement('button')
    const el2 = document.createElement('button')
    const event1 = new MouseEvent('click')
    const event2 = new MouseEvent('click')
    Object.defineProperty(event1, 'currentTarget', { value: el1 })
    Object.defineProperty(event2, 'currentTarget', { value: el2 })

    await openMenu(event1, tree.operation)
    await openMenu(event2, tree.example)

    // Second call should be ignored so the user does not accidentally
    // swap menus mid-animation.
    expect(menuTarget.value?.item.id).toBe('op-1')
    expect(menuTarget.value?.el).toBe(el1)
  })

  it('closeMenu keeps the target around so exit animations can play', async () => {
    const { menuTarget, openMenu, closeMenu, tree } = setup()
    const el = document.createElement('button')
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', { value: el })

    await openMenu(event, tree.operation)
    closeMenu()

    expect(menuTarget.value).not.toBeNull()
    expect(menuTarget.value?.showMenu).toBe(false)
    expect(menuTarget.value?.item.id).toBe('op-1')
  })

  it('renders a stronger delete message for documents', async () => {
    const { deleteMessage, openMenu, tree } = setup()
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', {
      value: document.createElement('button'),
    })

    await openMenu(event, tree.document)

    expect(deleteMessage.value).toBe(
      "This cannot be undone. You're about to delete the document and all tags and operations inside it.",
    )
  })

  it('renders a generic delete message for non-document items', async () => {
    const { deleteMessage, openMenu, tree } = setup()
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', {
      value: document.createElement('button'),
    })

    await openMenu(event, tree.tag)

    expect(deleteMessage.value).toBe(
      'Are you sure you want to delete this tag? This action cannot be undone.',
    )
  })

  it('falls back to "item" in the delete message when no target is set', () => {
    const { deleteMessage } = setup()

    expect(deleteMessage.value).toBe(
      'Are you sure you want to delete this item? This action cannot be undone.',
    )
  })

  it('emits document:delete:document for a document target', async () => {
    const { eventBus, openMenu, handleDelete, tree } = setup()
    const listener = vi.fn()
    eventBus.on('document:delete:document', listener)
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', {
      value: document.createElement('button'),
    })

    await openMenu(event, tree.document)
    handleDelete()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ name: 'pets' })
  })

  it('emits tag:delete:tag for a tag target', async () => {
    const { eventBus, openMenu, handleDelete, tree } = setup()
    const listener = vi.fn()
    eventBus.on('tag:delete:tag', listener)
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', {
      value: document.createElement('button'),
    })

    await openMenu(event, tree.tag)
    handleDelete()

    expect(listener).toHaveBeenCalledWith({ documentName: 'pets', name: 'Pets' })
  })

  it('emits operation:delete:operation for an operation target', async () => {
    const { eventBus, openMenu, handleDelete, tree } = setup()
    const listener = vi.fn()
    eventBus.on('operation:delete:operation', listener)
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', {
      value: document.createElement('button'),
    })

    await openMenu(event, tree.operation)
    handleDelete()

    expect(listener).toHaveBeenCalledWith({
      meta: { method: 'get', path: '/pets' },
      documentName: 'pets',
    })
  })

  it('emits operation:delete:example for an example target', async () => {
    const { eventBus, openMenu, handleDelete, tree } = setup()
    const listener = vi.fn()
    eventBus.on('operation:delete:example', listener)
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', {
      value: document.createElement('button'),
    })

    await openMenu(event, tree.example)
    handleDelete()

    expect(listener).toHaveBeenCalledWith({
      meta: { method: 'get', path: '/pets', exampleKey: 'default' },
      documentName: 'pets',
    })
  })

  it('does not emit when the target has no parent document', async () => {
    const orphan = {
      id: 'orphan',
      type: 'tag',
      name: 'orphan',
      title: 'Orphan',
    } as unknown as TraversedEntry
    const eventBus = createWorkspaceEventBus({ debug: false })
    const sidebarState = createFakeSidebarState([orphan])
    const { openMenu, handleDelete } = useSidebarContextMenu({
      eventBus,
      sidebarState,
    })

    const tagListener = vi.fn()
    const documentListener = vi.fn()
    eventBus.on('tag:delete:tag', tagListener)
    eventBus.on('document:delete:document', documentListener)

    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', {
      value: document.createElement('button'),
    })

    await openMenu(event, orphan)
    handleDelete()

    expect(tagListener).not.toHaveBeenCalled()
    expect(documentListener).not.toHaveBeenCalled()
  })

  it('resets the menu target after a successful delete', async () => {
    const { menuTarget, deleteModalState, openMenu, handleDelete, tree } =
      setup()
    const event = new MouseEvent('click')
    Object.defineProperty(event, 'currentTarget', {
      value: document.createElement('button'),
    })

    await openMenu(event, tree.operation)
    deleteModalState.show()
    expect(deleteModalState.open).toBe(true)

    handleDelete()
    await nextTick()

    expect(menuTarget.value).toBeNull()
    expect(deleteModalState.open).toBe(false)
  })

  it('is a no-op when handleDelete is called with no active target', () => {
    const { eventBus, handleDelete } = setup()
    const listener = vi.fn()
    eventBus.on('document:delete:document', listener)
    eventBus.on('tag:delete:tag', listener)
    eventBus.on('operation:delete:operation', listener)
    eventBus.on('operation:delete:example', listener)

    handleDelete()

    expect(listener).not.toHaveBeenCalled()
  })
})
