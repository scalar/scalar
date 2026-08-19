import 'fake-indexeddb/auto'

import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, reactive, ref } from 'vue'

import { createChatHistory } from './create-chat-history'
import { type SessionChat, createChatSessions, getChatTitle } from './create-chat-sessions'

type FakeChat = SessionChat & { id: string }

const createFakeChat = (chatId: string): FakeChat => reactive({ id: chatId, messages: [], status: 'ready' }) as FakeChat

const userMessage = (text: string): FakeChat['messages'][number] => ({
  id: `msg-${text}`,
  role: 'user',
  parts: [{ type: 'text', text }],
})

/**
 * The production chains cross several fake-indexeddb macrotask turns (each
 * IndexedDB operation opens a fresh connection), so a single timer turn is
 * a race. Poll with vi.waitFor instead of guessing turn counts.
 */
const waitFor = (assertion: () => void): Promise<void> => vi.waitFor(assertion, { timeout: 2000, interval: 5 })

const flushWatchers = async (): Promise<void> => {
  await nextTick()
}

describe('create-chat-sessions', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
    localStorage.clear()
  })

  describe('getChatTitle', () => {
    it('uses the first user text part', () => {
      expect(getChatTitle([userMessage('How do I authenticate?')], 'Untitled chat')).toBe('How do I authenticate?')
    })

    it('falls back to the untitled label', () => {
      expect(getChatTitle([], 'Untitled chat')).toBe('Untitled chat')
      expect(getChatTitle([{ id: 'm', role: 'user', parts: [{ type: 'file' }] }], 'Untitled chat')).toBe(
        'Untitled chat',
      )
      expect(getChatTitle([userMessage('   ')], 'Untitled chat')).toBe('Untitled chat')
    })

    it('truncates on a word boundary with an ellipsis', () => {
      const text = 'This is a very long question about authentication flows and refresh tokens in the API'
      const title = getChatTitle([userMessage(text)], 'Untitled chat')

      expect(title.length).toBeLessThanOrEqual(51)
      expect(title.endsWith('…')).toBe(true)
      // No mid-word cut: the char before the ellipsis is not a space and the title is a prefix of the text.
      expect(text.startsWith(title.slice(0, -1))).toBe(true)
      expect(title.at(-2)).not.toBe(' ')
    })
  })

  it('lazily creates one instance per chat id', () => {
    const created: string[] = []
    const sessions = createChatSessions({
      createChat: (chatId) => {
        created.push(chatId)
        return createFakeChat(chatId)
      },
    })

    const first = sessions.activeChat.value
    expect(sessions.activeChat.value).toBe(first)
    expect(created).toHaveLength(1)
  })

  it('persists through the two-watcher pair and titles the record', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({ createChat: createFakeChat, history })
    const chat = sessions.activeChat.value

    chat.messages.push(userMessage('Hello there'))
    await waitFor(() => expect(history.chatList.value[0]?.title).toBe('Hello there'))

    // The status watcher persists the final streamed content: mutate a part
    // in place (no count change), then settle the status.
    chat.status = 'streaming'
    await flushWatchers()
    const part = chat.messages[0]?.parts[0] as unknown as { text: string }
    part.text = 'Hello there, edited'
    chat.status = 'ready'

    await waitFor(() => expect(history.chatList.value[0]?.title).toBe('Hello there, edited'))
  })

  it('remembers the last chat id in localStorage', async () => {
    const sessions = createChatSessions({
      createChat: createFakeChat,
      lastChatStorageKey: 'scalar-agent-last-chat',
    })

    sessions.activeChat.value.messages.push(userMessage('first'))
    sessions.startNewChat()
    await flushWatchers()

    expect(localStorage.getItem('scalar-agent-last-chat')).toBe(sessions.currentChatId.value)
  })

  it('resolves a getter lastChatStorageKey at read and write time', async () => {
    // The editor scopes the pointer per project; the key must follow.
    let project = 'project-a'
    localStorage.setItem('editor-last-chat-project-a', 'chat-a')

    const sessions = createChatSessions({
      createChat: createFakeChat,
      lastChatStorageKey: () => `editor-last-chat-${project}`,
    })

    expect(sessions.currentChatId.value).toBe('chat-a')

    project = 'project-b'
    sessions.activeChat.value.messages.push(userMessage('first'))
    sessions.startNewChat()
    await flushWatchers()

    expect(localStorage.getItem('editor-last-chat-project-b')).toBe(sessions.currentChatId.value)
  })

  it('starts a new chat only when the current one has messages', () => {
    const sessions = createChatSessions({ createChat: createFakeChat })
    const initialId = sessions.currentChatId.value

    sessions.startNewChat()
    expect(sessions.currentChatId.value).toBe(initialId)

    sessions.activeChat.value.messages.push(userMessage('hello'))
    sessions.startNewChat()
    expect(sessions.currentChatId.value).not.toBe(initialId)
  })

  it('switches chats and hydrates stored messages', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value
    await history.saveChat({
      id: 'stored-chat',
      title: 'Stored',
      messages: [userMessage('from storage')],
      createdAt: 1,
      updatedAt: 1,
    })

    const sessions = createChatSessions({ createChat: createFakeChat, history })
    await sessions.switchToChat('stored-chat')

    expect(sessions.currentChatId.value).toBe('stored-chat')
    expect(sessions.activeChat.value.messages[0]?.parts[0]).toMatchObject({ text: 'from storage' })
  })

  it('falls back to the most recent chat when deleting the active one', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({ createChat: createFakeChat, history })

    sessions.activeChat.value.messages.push(userMessage('first chat'))
    const firstId = sessions.currentChatId.value
    await waitFor(() => expect(history.chatList.value).toHaveLength(1))

    sessions.startNewChat()
    sessions.activeChat.value.messages.push(userMessage('second chat'))
    const secondId = sessions.currentChatId.value
    await waitFor(() => expect(history.chatList.value).toHaveLength(2))

    await sessions.deleteChat(secondId)
    expect(sessions.currentChatId.value).toBe(firstId)
  })

  it('lands on a fresh chat when the list empties', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({ createChat: createFakeChat, history })
    sessions.activeChat.value.messages.push(userMessage('only chat'))
    const onlyId = sessions.currentChatId.value
    await waitFor(() => expect(history.chatList.value).toHaveLength(1))

    await sessions.deleteChat(onlyId)
    expect(sessions.currentChatId.value).not.toBe(onlyId)
    expect(sessions.hasHistory.value).toBe(false)
  })

  it('keeps the active chat when deleting an inactive one without history', async () => {
    const sessions = createChatSessions({ createChat: createFakeChat })

    sessions.activeChat.value.messages.push(userMessage('active conversation'))
    const activeId = sessions.currentChatId.value

    await sessions.deleteChat('some-other-id')

    expect(sessions.currentChatId.value).toBe(activeId)
    expect(sessions.activeChat.value.messages).toHaveLength(1)
  })

  it('does not resurrect a chat deleted while its stream settles', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({ createChat: createFakeChat, history })
    const chat = sessions.activeChat.value
    const chatId = sessions.currentChatId.value

    chat.messages.push(userMessage('streaming chat'))
    await waitFor(() => expect(history.chatList.value).toHaveLength(1))

    chat.status = 'streaming'
    await flushWatchers()

    await sessions.deleteChat(chatId)
    await waitFor(() => expect(history.chatList.value).toHaveLength(0))

    // The stream settles after deletion: the disposed watchers must not
    // re-persist the record.
    chat.status = 'ready'
    await flushWatchers()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(history.chatList.value).toHaveLength(0)
  })

  it('restores the remembered chat on first open, with a most-recent fallback', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value
    await history.saveChat({
      id: 'recent-chat',
      title: 'Recent',
      messages: [userMessage('recent')],
      createdAt: 5,
      updatedAt: 5,
    })

    // The remembered id has no stored record: fall back to the most recent.
    localStorage.setItem('scalar-agent-last-chat', 'stale-id')
    const open = ref(false)
    const sessions = createChatSessions({
      createChat: createFakeChat,
      history,
      lastChatStorageKey: 'scalar-agent-last-chat',
      open,
    })

    open.value = true

    await waitFor(() => expect(sessions.currentChatId.value).toBe('recent-chat'))
    expect(sessions.activeChat.value.messages).toHaveLength(1)
  })

  it('rehydrates after reset — the project-switch flow must not skip hydration', async () => {
    const history = createChatHistory({ dbName: 'scalar-editor-agent-chat' })
    await history.ready.value
    await history.saveChat({
      id: 'project-chat',
      title: 'Project chat',
      messages: [userMessage('existing conversation')],
      createdAt: 1,
      updatedAt: 1,
    })

    localStorage.setItem('last-chat', 'project-chat')
    const open = ref(true)
    const sessions = createChatSessions({
      createChat: createFakeChat,
      history,
      lastChatStorageKey: 'last-chat',
      open,
    })

    await waitFor(() => expect(sessions.activeChat.value.messages).toHaveLength(1))
    const beforeReset = sessions.activeChat.value

    // Project switch: instances dropped, the pointer re-read. The remembered
    // pointer is unchanged, which must still invalidate activeChat — the
    // disposed pre-reset instance persists nothing anymore. Close and open
    // flush separately, as they do in real usage.
    open.value = false
    await nextTick()
    sessions.reset()
    open.value = true
    await nextTick()

    await waitFor(() => expect(sessions.activeChat.value.messages).toHaveLength(1))
    expect(sessions.activeChat.value).not.toBe(beforeReset)

    // Messages sent after the reset must reach storage through the fresh
    // instance's watchers.
    sessions.activeChat.value.messages.push(userMessage('after reset'))
    await waitFor(() => {
      const stored = history.chatList.value.find((chat) => chat.id === 'project-chat')
      expect(stored?.messages).toHaveLength(2)
    })
  })

  it('does not resurrect a record whose save was in flight when everything was cleared', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({ createChat: createFakeChat, history })
    const chatId = sessions.currentChatId.value

    sessions.activeChat.value.messages.push(userMessage('racing'))
    // One flush: the persistence watcher fires and the put is in flight,
    // but the record is not yet in chatList when clearAll snapshots it.
    await nextTick()

    await sessions.clearAllChats()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(history.chatList.value).toHaveLength(0)
    expect(await history.loadChat(chatId)).toBeUndefined()
  })

  it('does not rewrite stored records on view', async () => {
    const history = createChatHistory({ dbName: 'scalar-editor-agent-chat' })
    await history.ready.value
    await history.saveChat({
      id: 'old-chat',
      title: 'Old chat',
      messages: [userMessage('old conversation')],
      createdAt: 1,
      updatedAt: 1,
    })
    await history.saveChat({
      id: 'new-chat',
      title: 'New chat',
      messages: [userMessage('new conversation')],
      createdAt: 100,
      updatedAt: 100,
    })

    const sessions = createChatSessions({ createChat: createFakeChat, history })
    await sessions.switchToChat('old-chat')
    await new Promise((resolve) => setTimeout(resolve, 50))

    await history.refresh()
    const oldChat = history.chatList.value.find((chat) => chat.id === 'old-chat')

    // Viewing must not bump updatedAt — in updatedAt-sorted lists it would
    // reorder history into recently-viewed order.
    expect(oldChat?.updatedAt).toBe(1)
    expect(history.chatList.value[0]?.id).toBe('new-chat')
  })

  it('preserves unknown stored fields when re-persisting', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value
    await history.saveChat({
      id: 'annotated-chat',
      title: 'Annotated',
      messages: [userMessage('hello')],
      createdAt: 1,
      updatedAt: 1,
      customField: 'ride-along',
    })

    localStorage.setItem('last-chat', 'annotated-chat')
    const sessions = createChatSessions({
      createChat: createFakeChat,
      history,
      lastChatStorageKey: 'last-chat',
      open: ref(true),
    })

    await waitFor(() => expect(sessions.activeChat.value.messages).toHaveLength(1))
    sessions.activeChat.value.messages.push(userMessage('a real new message'))

    await waitFor(() => {
      const stored = history.chatList.value.find((chat) => chat.id === 'annotated-chat')
      expect(stored?.messages).toHaveLength(2)
      expect(stored?.customField).toBe('ride-along')
    })
  })

  it('persists extended record fields', async () => {
    const history = createChatHistory({ dbName: 'scalar-editor-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({
      createChat: createFakeChat,
      history,
      extendRecord: () => ({ projectUid: 'project-1', mode: 'medium' }),
    })

    sessions.activeChat.value.messages.push(userMessage('editor chat'))

    await waitFor(() => expect(history.chatList.value[0]).toMatchObject({ projectUid: 'project-1', mode: 'medium' }))
  })

  it('clears everything and resets to a fresh chat', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({ createChat: createFakeChat, history })
    sessions.activeChat.value.messages.push(userMessage('a chat'))
    await waitFor(() => expect(history.chatList.value).toHaveLength(1))

    await sessions.clearAllChats()
    expect(sessions.hasHistory.value).toBe(false)
    expect(sessions.activeChat.value.messages).toHaveLength(0)
  })

  it('does not touch localStorage on the server', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')

    createChatSessions({
      createChat: createFakeChat,
      lastChatStorageKey: 'scalar-agent-last-chat',
      isServer: true,
    })

    expect(getItem).not.toHaveBeenCalled()
    getItem.mockRestore()
  })

  it('degrades to an ephemeral session when localStorage throws', async () => {
    // Sandboxed iframes without allow-same-origin throw SecurityError on
    // any localStorage access — the factory must not crash the surface.
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    try {
      const sessions = createChatSessions({
        createChat: createFakeChat,
        lastChatStorageKey: 'scalar-agent-last-chat',
      })

      sessions.activeChat.value.messages.push(userMessage('works without storage'))
      sessions.startNewChat()
      await flushWatchers()

      expect(sessions.activeChat.value.messages).toHaveLength(0)
    } finally {
      getItem.mockRestore()
      setItem.mockRestore()
    }
  })

  it('never persists a remembered chat before its record has hydrated', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value
    await history.saveChat({
      id: 'remembered-chat',
      title: 'Remembered',
      messages: [userMessage('one'), userMessage('two')],
      createdAt: 1,
      updatedAt: 1,
    })

    localStorage.setItem('last-chat', 'remembered-chat')
    // The panel never opens, so hydration never runs — a message sent now
    // must not overwrite the stored two-message conversation.
    const sessions = createChatSessions({
      createChat: createFakeChat,
      history,
      lastChatStorageKey: 'last-chat',
      open: ref(false),
    })

    sessions.activeChat.value.messages.push(userMessage('pre-hydration message'))
    await new Promise((resolve) => setTimeout(resolve, 100))

    const stored = await history.loadChat('remembered-chat')
    expect(stored?.messages).toHaveLength(2)
  })

  it('hydrates immediately when no open ref is given', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value
    await history.saveChat({
      id: 'full-page-chat',
      title: 'Full page',
      messages: [userMessage('restored')],
      createdAt: 1,
      updatedAt: 1,
    })

    localStorage.setItem('last-chat', 'full-page-chat')
    const sessions = createChatSessions({
      createChat: createFakeChat,
      history,
      lastChatStorageKey: 'last-chat',
    })

    await waitFor(() => expect(sessions.activeChat.value.messages).toHaveLength(1))
  })

  describe('hydration races', () => {
    type StoredChatLike = {
      id: string
      title: string
      messages: unknown[]
      createdAt: number
      updatedAt: number
    }

    /** A history stub whose loadChat resolution the test controls. */
    const createGatedHistory = (stored: Record<string, StoredChatLike>) => {
      const releases: (() => void)[] = []
      const saveChat = vi.fn(async (_chat: StoredChatLike) => {})

      return {
        history: {
          chatList: ref([]),
          ready: ref(Promise.resolve()),
          refresh: async () => {},
          saveChat,
          deleteChat: async () => {},
          loadChat: (id: string) =>
            new Promise<StoredChatLike | undefined>((resolve) => {
              releases.push(() => resolve(stored[id]))
            }),
          clearAll: async () => {},
          dispose: () => {},
        },
        releases,
        saveChat,
      }
    }

    it('keeps a message sent while the record was loading', async () => {
      const { history, releases } = createGatedHistory({
        'remembered-chat': {
          id: 'remembered-chat',
          title: 'Remembered',
          messages: [userMessage('one'), userMessage('two')],
          createdAt: 1,
          updatedAt: 1,
        },
      })

      localStorage.setItem('last-chat', 'remembered-chat')
      const sessions = createChatSessions({
        createChat: createFakeChat,
        history,
        lastChatStorageKey: 'last-chat',
      })

      // Hydration is awaiting the gated loadChat; the user sends now.
      await waitFor(() => expect(releases).toHaveLength(1))
      sessions.activeChat.value.messages.push(userMessage('typed mid-load'))

      releases[0]?.()

      // The stored conversation merges IN FRONT of the live message —
      // a wholesale assignment would silently destroy it.
      await waitFor(() => expect(sessions.activeChat.value.messages).toHaveLength(3))
      expect(sessions.activeChat.value.messages.at(-1)?.parts[0]).toMatchObject({ text: 'typed mid-load' })
    })

    it('discards a hydration continuation that predates reset()', async () => {
      const { history, releases, saveChat } = createGatedHistory({
        'remembered-chat': {
          id: 'remembered-chat',
          title: 'Remembered',
          messages: [userMessage('one'), userMessage('two'), userMessage('three')],
          createdAt: 1,
          updatedAt: 1,
        },
      })

      localStorage.setItem('last-chat', 'remembered-chat')
      const sessions = createChatSessions({
        createChat: createFakeChat,
        history,
        lastChatStorageKey: 'last-chat',
      })

      await waitFor(() => expect(releases).toHaveLength(1))

      // Project switch while the initial load is still in flight.
      sessions.reset()

      // The stale continuation resolves now — it must NOT re-mark the id
      // as safe to persist.
      releases[0]?.()
      await flushWatchers()

      // A message sent before the post-reset rehydration lands must not
      // overwrite the stored three-message conversation.
      sessions.activeChat.value.messages.push(userMessage('after reset'))
      await new Promise((resolve) => setTimeout(resolve, 50))

      const clobber = saveChat.mock.calls.find(([saved]) => saved.messages.length === 1)
      expect(clobber).toBeUndefined()
    })
  })

  describe('delete and clear races', () => {
    /** A history stub whose deleteChat/clearAll resolution the test controls. */
    const createGatedDeleteHistory = () => {
      const releases: (() => void)[] = []

      return {
        history: {
          chatList: ref([]),
          ready: ref(Promise.resolve()),
          refresh: async () => {},
          saveChat: async () => {},
          deleteChat: () =>
            new Promise<void>((resolve) => {
              releases.push(resolve)
            }),
          loadChat: async () => undefined,
          clearAll: () =>
            new Promise<void>((resolve) => {
              releases.push(resolve)
            }),
          dispose: () => {},
        },
        releases,
      }
    }

    it('never lets a deleteChat that predates reset() clobber the new scope', async () => {
      const { history, releases } = createGatedDeleteHistory()
      let project = 'project-a'

      const sessions = createChatSessions({
        createChat: createFakeChat,
        history,
        lastChatStorageKey: () => `last-chat-${project}`,
      })

      // The delete suspends on storage while a project switch lands.
      void sessions.deleteChat(sessions.currentChatId.value)
      await waitFor(() => expect(releases).toHaveLength(1))

      project = 'project-b'
      sessions.reset()
      const resetId = sessions.currentChatId.value

      releases[0]?.()
      await flushWatchers()

      // The stale delete's aftermath must not replace the id the reset chose
      // — nor overwrite the NEW scope's remembered pointer with a bogus id.
      expect(sessions.currentChatId.value).toBe(resetId)
      expect(localStorage.getItem('last-chat-project-b')).toBe(resetId)
    })

    it('never lets a clearAllChats that predates reset() clobber the new scope', async () => {
      const { history, releases } = createGatedDeleteHistory()
      let project = 'project-a'

      const sessions = createChatSessions({
        createChat: createFakeChat,
        history,
        lastChatStorageKey: () => `last-chat-${project}`,
      })

      void sessions.clearAllChats()
      await waitFor(() => expect(releases).toHaveLength(1))

      project = 'project-b'
      sessions.reset()
      const resetId = sessions.currentChatId.value

      releases[0]?.()
      await flushWatchers()

      expect(sessions.currentChatId.value).toBe(resetId)
      expect(localStorage.getItem('last-chat-project-b')).toBe(resetId)
    })
  })

  it('keeps a remembered fresh chat when mostRecentFallback is off', async () => {
    const history = createChatHistory({ dbName: 'scalar-editor-agent-chat' })
    await history.ready.value
    await history.saveChat({
      id: 'older-chat',
      title: 'Older',
      messages: [userMessage('stored')],
      createdAt: 1,
      updatedAt: 1,
    })

    // The pointer names a deliberately fresh chat that was never persisted —
    // the editor's "New chat" surviving a reload.
    localStorage.setItem('last-chat', 'fresh-empty-chat')
    const sessions = createChatSessions({
      createChat: createFakeChat,
      history,
      lastChatStorageKey: 'last-chat',
      mostRecentFallback: false,
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(sessions.currentChatId.value).toBe('fresh-empty-chat')
    expect(sessions.activeChat.value.messages).toHaveLength(0)
  })

  it('keeps persisting when the creating component scope dies', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({ createChat: createFakeChat, history })

    // A short-lived component is the first to touch the active chat: its
    // effect scope must not adopt (and later kill) the persistence watchers.
    const shortLived = effectScope()
    shortLived.run(() => {
      void sessions.activeChat.value
    })
    shortLived.stop()

    sessions.activeChat.value.messages.push(userMessage('after scope death'))
    await waitFor(() => expect(history.chatList.value).toHaveLength(1))
  })
})
