import { type ComputedRef, type Ref, computed, nextTick, ref, watch } from 'vue'

import type { ChatHistory, StoredChat } from '@/composables/create-chat-history'

/**
 * The structural surface of an `@ai-sdk/vue` `Chat` instance the session core
 * needs. Kept structural so the core is testable without a transport and does
 * not force a specific SDK version on consumers.
 */
export type SessionChat = {
  messages: {
    id: string
    role: string
    parts: { type: string; [key: string]: unknown }[]
  }[]
  status: string
}

export type ChatSessionsOptions<TChat extends SessionChat> = {
  /** Build a Chat instance for a session id. The shell owns transport, endpoint, auth and tool wiring. */
  createChat: (chatId: string) => TChat
  /** Persistence adapter. Omit for ephemeral surfaces — everything else keeps working. */
  history?: ChatHistory
  /** localStorage key remembering the last active chat. Shipped surfaces keep their existing keys. */
  lastChatStorageKey?: string
  /** Skip storage access during SSR/SSG rendering. */
  isServer?: boolean
  /**
   * When provided, stored messages hydrate on every flip to `true` — the
   * donors' open-on-panel behavior (hydration is idempotent). Full-page
   * surfaces pass a `ref(true)`.
   */
  open?: Ref<boolean>
  /** Extra fields persisted on every record (for example `projectUid`, `mode`). */
  extendRecord?: () => Record<string, unknown>
  /** Title for chats without a user message yet. Wire the copy dictionary's `session.untitledChat` here. */
  untitledTitle?: string
}

export type ChatSessions<TChat extends SessionChat> = {
  currentChatId: Ref<string>
  activeChat: ComputedRef<TChat>
  chatList: ComputedRef<StoredChat[]>
  hasHistory: ComputedRef<boolean>
  getChatInstance: (chatId: string) => TChat
  ensureLoaded: (chatId: string) => Promise<void>
  switchToChat: (chatId: string) => Promise<void>
  startNewChat: () => void
  deleteChat: (chatId: string) => Promise<void>
  clearAllChats: () => Promise<void>
  /** Drop every instance and re-read the last-chat pointer — the editor's project-switch reset. */
  reset: () => void
}

const TITLE_MAX_LENGTH = 50

/**
 * Derive a chat title from the first user text part: truncated on a word
 * boundary with an ellipsis, falling back to the untitled label.
 */
export const getChatTitle = (messages: SessionChat['messages'], untitledTitle: string): string => {
  const firstUserMessage = messages.find((message) => message.role === 'user')

  if (!firstUserMessage) {
    return untitledTitle
  }

  const textPart = firstUserMessage.parts.find((part) => part.type === 'text')

  if (!textPart || typeof textPart.text !== 'string') {
    return untitledTitle
  }

  const text = textPart.text.trim()

  if (!text) {
    return untitledTitle
  }

  if (text.length <= TITLE_MAX_LENGTH) {
    return text
  }

  const slice = text.slice(0, TITLE_MAX_LENGTH)
  const lastSpace = slice.lastIndexOf(' ')

  return `${(lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`
}

const generateChatId = (): string => crypto.randomUUID()

/**
 * The session core every chat surface shares: a lazily-populated
 * `Map<chatId, Chat>`, IndexedDB persistence with the two-watcher pair, and
 * the session operations. Ported from the two org implementations that
 * independently converged on this architecture (guide-layout `useAgentChat`,
 * dashboard `useEditorAgentChat`) and parameterized over their divergences.
 */
export const createChatSessions = <TChat extends SessionChat>(
  options: ChatSessionsOptions<TChat>,
): ChatSessions<TChat> => {
  const {
    createChat,
    history,
    lastChatStorageKey,
    isServer = false,
    open,
    extendRecord,
    untitledTitle = 'Untitled chat',
  } = options

  const readLastChatId = (): string => {
    if (isServer || !lastChatStorageKey) {
      return generateChatId()
    }

    return localStorage.getItem(lastChatStorageKey) || generateChatId()
  }

  const currentChatId = ref(readLastChatId())

  if (lastChatStorageKey) {
    watch(currentChatId, (id) => {
      if (!isServer) {
        localStorage.setItem(lastChatStorageKey, id)
      }
    })
  }

  const chatInstances = new Map<string, TChat>()

  /**
   * Stop handles for each instance's persistence watchers. Without stopping
   * them on delete, a chat deleted mid-stream would re-persist itself when
   * its stream settles — resurrecting the record the user just deleted.
   */
  const instanceWatchStops = new Map<string, (() => void)[]>()

  /**
   * Chat ids whose messages are currently being assigned from storage.
   * Hydration must not fire the persistence watchers — re-persisting on view
   * would bump `updatedAt` (reordering updatedAt-sorted lists into
   * recently-viewed order) and rewrite records without any user action.
   */
  const hydratingIds = new Set<string>()

  const persist = (chatId: string, instance: TChat): void => {
    if (!history || !instance.messages.length) {
      return
    }

    // The stored record is spread first so unknown ride-along fields older
    // clients persisted survive the rewrite; createdAt is looked up at
    // persist time so a record created by another instance of the same chat
    // keeps its original timestamp.
    const stored = history.chatList.value.find((chat) => chat.id === chatId)

    void history.saveChat({
      ...stored,
      ...extendRecord?.(),
      id: chatId,
      title: getChatTitle(instance.messages, untitledTitle),
      messages: JSON.parse(JSON.stringify(instance.messages)) as unknown[],
      createdAt: stored?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    })
  }

  const createChatInstance = (chatId: string): TChat => {
    const instance = createChat(chatId)

    chatInstances.set(chatId, instance)

    // The two-watcher persistence pair both donors converged on: the count
    // watcher captures each message as it is added; the status watcher
    // captures the final streamed content, because the count does not change
    // while the last message's parts mutate in place.
    const stopCountWatcher = watch(
      () => instance.messages.length,
      (length) => {
        if (length && !hydratingIds.has(chatId)) {
          persist(chatId, instance)
        }
      },
    )
    const stopStatusWatcher = watch(
      () => instance.status,
      (status) => {
        if (status === 'ready' && instance.messages.length && !hydratingIds.has(chatId)) {
          persist(chatId, instance)
        }
      },
    )

    instanceWatchStops.set(chatId, [stopCountWatcher, stopStatusWatcher])

    return instance
  }

  const disposeInstance = (chatId: string): void => {
    for (const stop of instanceWatchStops.get(chatId) ?? []) {
      stop()
    }

    instanceWatchStops.delete(chatId)
    chatInstances.delete(chatId)
  }

  const getChatInstance = (chatId: string): TChat => chatInstances.get(chatId) ?? createChatInstance(chatId)

  /**
   * Bumped by `reset()`. Without it, a reset that re-reads an unchanged
   * last-chat pointer would be a same-value ref write — the computed below
   * would keep exposing the disposed pre-reset instance, whose messages are
   * never persisted again.
   */
  const instanceGeneration = ref(0)

  const activeChat = computed(() => {
    void instanceGeneration.value
    return getChatInstance(currentChatId.value)
  })

  const chatList = computed(() => history?.chatList.value ?? [])
  const hasHistory = computed(() => chatList.value.length > 0)

  const ensureLoaded = async (chatId: string): Promise<void> => {
    if (!history) {
      return
    }

    const instance = getChatInstance(chatId)

    if (instance.messages.length) {
      return
    }

    const stored = await history.loadChat(chatId)

    if (stored) {
      // The guard stays set until the watcher flush after the assignment has
      // run, so hydration never masquerades as user activity.
      hydratingIds.add(chatId)
      instance.messages = stored.messages as TChat['messages']
      await nextTick()
      hydratingIds.delete(chatId)
    }
  }

  const switchToChat = async (chatId: string): Promise<void> => {
    if (chatId === currentChatId.value) {
      return
    }

    await ensureLoaded(chatId)
    currentChatId.value = chatId
  }

  const startNewChat = (): void => {
    if (!activeChat.value.messages.length) {
      return
    }

    // The old instance stays in the map; its record persists lazily.
    currentChatId.value = generateChatId()
  }

  const deleteChat = async (chatId: string): Promise<void> => {
    const wasActive = chatId === currentChatId.value

    disposeInstance(chatId)
    await history?.deleteChat(chatId)

    if (history && !chatList.value.length) {
      // The list emptied: land on a fresh chat even when the deleted chat
      // was not active, so a stale pointer never survives an empty list.
      currentChatId.value = generateChatId()
      return
    }

    if (wasActive) {
      const nextId = chatList.value[0]?.id

      if (nextId) {
        await switchToChat(nextId)
      } else {
        currentChatId.value = generateChatId()
      }
    }
  }

  const clearAllChats = async (): Promise<void> => {
    for (const chatId of [...chatInstances.keys()]) {
      disposeInstance(chatId)
    }

    await history?.clearAll()
    currentChatId.value = generateChatId()
  }

  /**
   * The most-recent fallback runs once per scope: a deliberately fresh new
   * chat must not be yanked back to an older one on every reopen. `reset()`
   * re-arms it for the next scope.
   */
  let restoredOnce = false

  const reset = (): void => {
    for (const chatId of [...chatInstances.keys()]) {
      disposeInstance(chatId)
    }

    restoredOnce = false
    currentChatId.value = readLastChatId()
    instanceGeneration.value += 1
  }

  if (history && open) {
    watch(
      open,
      async (isOpen) => {
        if (!isOpen) {
          return
        }

        await history.ready.value

        // Hydration runs on every open, like the donors — it is idempotent,
        // and a one-shot flag here would skip rehydration after reset().
        await ensureLoaded(currentChatId.value)

        if (restoredOnce) {
          return
        }

        restoredOnce = true

        if (!activeChat.value.messages.length && chatList.value.length) {
          await switchToChat(chatList.value[0]?.id ?? currentChatId.value)
        }
      },
      { immediate: true },
    )
  }

  return {
    currentChatId,
    activeChat,
    chatList,
    hasHistory,
    getChatInstance,
    ensureLoaded,
    switchToChat,
    startNewChat,
    deleteChat,
    clearAllChats,
    reset,
  }
}
