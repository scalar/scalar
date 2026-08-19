import 'fake-indexeddb/auto'

import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { type StoredChat, createChatHistory } from './create-chat-history'

const record = (id: string, overrides: Partial<StoredChat> = {}): StoredChat => ({
  id,
  title: `Chat ${id}`,
  messages: [{ id: `msg-${id}`, role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
})

describe('create-chat-history', () => {
  beforeEach(() => {
    // A fresh IndexedDB per test — fake-indexeddb keeps state module-wide otherwise.
    globalThis.indexedDB = new IDBFactory()
  })

  it('saves, lists and loads chats', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    await history.saveChat(record('a', { updatedAt: 10 }))
    await history.saveChat(record('b', { updatedAt: 20 }))

    expect(history.chatList.value.map((chat) => chat.id)).toEqual(['b', 'a'])

    const loaded = await history.loadChat('a')
    expect(loaded?.title).toBe('Chat a')
  })

  it('sorts by createdAt when configured — the docs panel order', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat', sortBy: 'createdAt' })
    await history.ready.value

    await history.saveChat(record('old', { createdAt: 100, updatedAt: 999 }))
    await history.saveChat(record('new', { createdAt: 200, updatedAt: 1 }))

    expect(history.chatList.value.map((chat) => chat.id)).toEqual(['new', 'old'])
  })

  it('scopes records by an indexed field — the editor model', async () => {
    const projectUid = ref('project-1')
    const history = createChatHistory({
      dbName: 'scalar-editor-agent-chat',
      scope: { indexName: 'projectUid', value: projectUid },
    })
    await history.ready.value

    await history.saveChat(record('a', { projectUid: 'project-1' }))

    const other = createChatHistory({
      dbName: 'scalar-editor-agent-chat',
      scope: { indexName: 'projectUid', value: ref('project-2') },
    })
    await other.ready.value
    await other.saveChat(record('b', { projectUid: 'project-2' }))

    await history.refresh()
    expect(history.chatList.value.map((chat) => chat.id)).toEqual(['a'])

    // Switching scope reloads the list for the new key.
    projectUid.value = 'project-2'
    await Promise.resolve()
    await history.ready.value
    expect(history.chatList.value.map((chat) => chat.id)).toEqual(['b'])
  })

  it('migrates malformed records on read instead of dropping the store', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    // A record persisted by an older client: missing timestamps and title.
    await history.saveChat({ id: 'legacy' } as StoredChat)
    await history.refresh()

    const [migrated] = history.chatList.value
    expect(migrated).toMatchObject({ id: 'legacy', title: '', messages: [], createdAt: 0, updatedAt: 0 })
  })

  it('clears only the current scope', async () => {
    const scoped = createChatHistory({
      dbName: 'scalar-editor-agent-chat',
      scope: { indexName: 'projectUid', value: ref('project-1') },
    })
    await scoped.ready.value
    await scoped.saveChat(record('a', { projectUid: 'project-1' }))

    const other = createChatHistory({
      dbName: 'scalar-editor-agent-chat',
      scope: { indexName: 'projectUid', value: ref('project-2') },
    })
    await other.ready.value
    await other.saveChat(record('b', { projectUid: 'project-2' }))

    await scoped.refresh()
    await scoped.clearAll()

    await other.refresh()
    expect(other.chatList.value.map((chat) => chat.id)).toEqual(['b'])
  })

  it('does nothing on the server', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat', isServer: true })
    await history.ready.value

    await history.saveChat(record('a'))
    expect(history.chatList.value).toEqual([])
    expect(await history.loadChat('a')).toBeUndefined()
  })
})
