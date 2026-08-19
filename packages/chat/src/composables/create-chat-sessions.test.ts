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

const flush = async (): Promise<void> => {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
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
    await flush()

    expect(history.chatList.value).toHaveLength(1)
    expect(history.chatList.value[0]?.title).toBe('Hello there')

    // The status watcher persists the final streamed content: mutate a part
    // in place (no count change), then settle the status.
    chat.status = 'streaming'
    await flush()
    const part = chat.messages[0]?.parts[0] as unknown as { text: string }
    part.text = 'Hello there, edited'
    chat.status = 'ready'
    await flush()

    expect(history.chatList.value[0]?.title).toBe('Hello there, edited')
  })

  it('remembers the last chat id in localStorage', async () => {
    const sessions = createChatSessions({
      createChat: createFakeChat,
      lastChatStorageKey: 'scalar-agent-last-chat',
    })

    sessions.activeChat.value.messages.push(userMessage('first'))
    sessions.startNewChat()
    await flush()

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
    await flush()
    const firstId = sessions.currentChatId.value

    sessions.startNewChat()
    sessions.activeChat.value.messages.push(userMessage('second chat'))
    await flush()
    const secondId = sessions.currentChatId.value

    await sessions.deleteChat(secondId)
    expect(sessions.currentChatId.value).toBe(firstId)
  })

  it('lands on a fresh chat when the list empties', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({ createChat: createFakeChat, history })
    sessions.activeChat.value.messages.push(userMessage('only chat'))
    await flush()
    const onlyId = sessions.currentChatId.value

    await sessions.deleteChat(onlyId)
    expect(sessions.currentChatId.value).not.toBe(onlyId)
    expect(sessions.hasHistory.value).toBe(false)
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
    await flush()

    expect(sessions.currentChatId.value).toBe('recent-chat')
    expect(sessions.activeChat.value.messages).toHaveLength(1)
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
    await flush()

    expect(history.chatList.value[0]).toMatchObject({ projectUid: 'project-1', mode: 'medium' })
  })

  it('clears everything and resets to a fresh chat', async () => {
    const history = createChatHistory({ dbName: 'scalar-agent-chat' })
    await history.ready.value

    const sessions = createChatSessions({ createChat: createFakeChat, history })
    sessions.activeChat.value.messages.push(userMessage('a chat'))
    await flush()

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
