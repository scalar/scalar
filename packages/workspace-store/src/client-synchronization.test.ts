import { describe, expect, it } from 'vitest'

import { createWorkspaceStore } from './client'

const document = (title: string): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: { title, version: '1' },
  paths: {},
})

describe('client-synchronization', () => {
  it('synchronizes loaded, replaced, selected and deleted documents without caller hooks', async () => {
    const store = createWorkspaceStore({ reactive: false })
    const titles: (string | undefined)[] = []
    store.onSynchronize(() => titles.push(store.workspace.activeDocument?.info?.title))
    await store.addDocument({ name: 'first', document: document('First') })
    expect(titles.at(-1)).toBe('First')
    await store.addDocument({ name: 'second', document: document('Second') })
    store.update('x-scalar-active-document', 'second')
    expect(titles.at(-1)).toBe('Second')
    await store.replaceDocument('second', document('Replaced'))
    expect(titles.at(-1)).toBe('Replaced')
    store.deleteDocument('second')
    expect(titles.at(-1)).toBe('First')
    const imported = createWorkspaceStore({ reactive: false })
    await imported.addDocument({ name: 'first', document: document('Imported') })
    store.loadWorkspace(imported.exportWorkspace())
    expect(titles.at(-1)).toBe('Imported')
  })

  it('settles direct writes, supports synchronizer writes and unregisters callbacks', () => {
    const store = createWorkspaceStore({ reactive: false })
    const values: (string | undefined)[] = []
    const unsubscribe = store.onSynchronize(() => {
      values.push(store.workspace['x-scalar-active-document'])
      store.update('x-scalar-active-environment', 'production')
    })
    store.workspace['x-scalar-active-document'] = 'direct'
    store.settle()
    expect(values).toStrictEqual(['direct'])
    expect(store.workspace['x-scalar-active-environment']).toBe('production')
    unsubscribe()
    store.update('x-scalar-active-document', 'next')
    expect(values).toStrictEqual(['direct'])
  })

  it('allows settling again after a synchronizer throws', () => {
    const store = createWorkspaceStore({ reactive: false })
    const unsubscribe = store.onSynchronize(() => {
      throw new Error('Synchronization failed')
    })
    expect(() => store.settle()).toThrow('Synchronization failed')
    unsubscribe()
    const values: string[] = []
    store.onSynchronize(() => {
      values.push('settled')
    })
    store.settle()
    expect(values).toStrictEqual(['settled'])
  })
})
