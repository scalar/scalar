import 'fake-indexeddb/auto'

import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'

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
})
