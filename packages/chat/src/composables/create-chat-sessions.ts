import { type ComputedRef, type Ref, computed, effectScope, nextTick, ref, watch } from 'vue'

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
   * donors' open-on-panel behavior (hydration is idempotent). Without it,
   * hydration runs once at creation, which is what full-page surfaces want.
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
  /** Drop every instance, re-read the last-chat pointer and rehydrate — the editor's project-switch reset. */
  reset: () => void
  /** Stop every watcher this factory created. Call when the owning surface is torn down for good. */
  dispose: () => void
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
 * localStorage access can throw (sandboxed iframes without
 * `allow-same-origin`, blocked third-party storage, full quotas) — exactly
 * the environments customer docs get embedded in. Storage is an enhancement,
 * never a gate on chatting.
 */
const safeReadStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeWriteStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Degrade to not remembering the last chat.
  }
}

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

  /**
   * All watchers live in a detached scope. Vue binds watchers to the ambient
   * effect scope at creation time — instances are created lazily from
   * whatever call site touches a chat id first, and if that happens inside a
   * short-lived component's setup, the component's unmount would silently
   * stop the persistence watchers while the instance stays cached.
   */
  const scope = effectScope(true)

  /**
   * Chat ids that are safe to persist: freshly generated ids, and ids whose
   * stored record has been loaded (or confirmed absent). A remembered id is
   * NOT safe until hydration lands — persisting an empty instance over its
   * stored record would destroy the previous conversation.
   */
  const hydratedIds = new Set<string>()

  const newChatId = (): string => {
    const id = generateChatId()
    hydratedIds.add(id)
    return id
  }

  const readLastChatId = (): string => {
    if (isServer || !lastChatStorageKey) {
      return newChatId()
    }

    const remembered = safeReadStorage(lastChatStorageKey)

    return remembered || newChatId()
  }

  const currentChatId = ref(readLastChatId())

  if (lastChatStorageKey) {
    scope.run(() => {
      watch(currentChatId, (id) => {
        if (!isServer) {
          safeWriteStorage(lastChatStorageKey, id)
        }
      })
    })
  }

  const chatInstances = new Map<string, TChat>()

  /**
   * Stop handles for each instance's persistence watchers. Without stopping
   * them on delete, a chat deleted mid-stream would re-persist itself when
   * its stream settles — resurrecting the record the user just deleted.
   */
  const instanceWatchStops = new Map<string, (() => void)[]>()

  const persist = (chatId: string, instance: TChat): void => {
    if (!history || !instance.messages.length || !hydratedIds.has(chatId)) {
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
    scope.run(() => {
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
    })

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

  /**
   * Chat ids whose messages are currently being assigned from storage.
   * Hydration must not fire the persistence watchers — re-persisting on view
   * would bump `updatedAt` (reordering updatedAt-sorted lists into
   * recently-viewed order) and rewrite records without any user action.
   */
  const hydratingIds = new Set<string>()

  const assignHydrated = async (instance: TChat, chatId: string, messages: TChat['messages']): Promise<void> => {
    // The guard stays set until the watcher flush after the assignment has
    // run, so hydration never masquerades as user activity.
    hydratingIds.add(chatId)
    instance.messages = messages
    await nextTick()
    hydratingIds.delete(chatId)
  }

  /**
   * Bumped by `reset()`. A hydration continuation that was suspended on its
   * storage read when the reset happened must discard everything — merging
   * a stale record, and above all re-marking the id as safe to persist,
   * would re-open the clobber window the `hydratedIds` gate closes.
   */
  let hydrationEpoch = 0

  const ensureLoaded = async (chatId: string): Promise<void> => {
    if (!history || hydratedIds.has(chatId)) {
      return
    }

    const instance = getChatInstance(chatId)
    const epoch = hydrationEpoch

    const stored = await history.loadChat(chatId)

    if (epoch !== hydrationEpoch) {
      return
    }

    if (stored?.messages.length) {
      // Merge, never assign wholesale: a message the user sent while the
      // record was loading (before OR during the await) must survive, in
      // front of nothing — the stored conversation happened earlier, so it
      // goes first. Ids dedupe re-hydrations.
      const localIds = new Set(instance.messages.map((message) => message.id))
      const storedMessages = (stored.messages as TChat['messages']).filter((message) => !localIds.has(message.id))

      if (storedMessages.length) {
        await assignHydrated(instance, chatId, [...storedMessages, ...instance.messages])

        if (epoch !== hydrationEpoch) {
          return
        }
      }
    }

    // Loaded or confirmed absent — either way the id is now safe to persist.
    hydratedIds.add(chatId)
  }

  /** The id of the most recent switch request; an awaited older switch must not win over it. */
  let latestSwitchTarget: string | undefined

  const switchToChat = async (chatId: string): Promise<void> => {
    if (chatId === currentChatId.value) {
      return
    }

    latestSwitchTarget = chatId
    await ensureLoaded(chatId)

    // A later switch superseded this one while its record was loading.
    if (latestSwitchTarget !== chatId) {
      return
    }

    currentChatId.value = chatId
  }

  /** Direct navigations must beat any in-flight switch that is still loading. */
  const cancelPendingSwitch = (): void => {
    latestSwitchTarget = undefined
  }

  const startNewChat = (): void => {
    if (!activeChat.value.messages.length) {
      return
    }

    cancelPendingSwitch()
    // The old instance stays in the map; its record persists lazily.
    currentChatId.value = newChatId()
  }

  const deleteChat = async (chatId: string): Promise<void> => {
    const wasActive = chatId === currentChatId.value

    await history?.deleteChat(chatId)

    if (history && chatList.value.some((chat) => chat.id === chatId)) {
      // The storage delete failed (quota, transient IndexedDB error): leave
      // the chat fully alive rather than disposing a chat the user can still
      // see. The adapter has already rolled back its delete tombstone.
      return
    }

    cancelPendingSwitch()

    // Dispose after the successful delete; the adapter's tombstone protects
    // against an in-flight save resurrecting the record in the meantime.
    disposeInstance(chatId)

    if (history && !chatList.value.length) {
      // The list emptied: land on a fresh chat even when the deleted chat
      // was not active, so a stale pointer never survives an empty list.
      currentChatId.value = newChatId()
      return
    }

    if (wasActive) {
      const nextId = chatList.value[0]?.id

      if (nextId) {
        await switchToChat(nextId)
      } else {
        currentChatId.value = newChatId()
      }
    }
  }

  const clearAllChats = async (): Promise<void> => {
    for (const chatId of [...chatInstances.keys()]) {
      disposeInstance(chatId)
    }

    await history?.clearAll()
    cancelPendingSwitch()
    currentChatId.value = newChatId()
  }

  /**
   * The most-recent fallback runs once per scope: a deliberately fresh new
   * chat must not be yanked back to an older one on every reopen. `reset()`
   * re-arms it for the next scope.
   */
  let restoredOnce = false

  const hydrate = async (): Promise<void> => {
    if (!history) {
      return
    }

    const epoch = hydrationEpoch

    // Wait a flush first: a scope change (editor project switch) reassigns
    // the adapter's `ready` in a pre-flush watcher, and a synchronously
    // invoked hydrate would otherwise await the OLD scope's already-resolved
    // promise and read the previous project's list in the fallback below.
    await nextTick()
    await history.ready.value

    if (epoch !== hydrationEpoch) {
      return
    }

    // Hydration runs on every open, like the donors — it is idempotent.
    await ensureLoaded(currentChatId.value)

    if (epoch !== hydrationEpoch || restoredOnce) {
      return
    }

    restoredOnce = true

    if (!activeChat.value.messages.length && chatList.value.length) {
      await switchToChat(chatList.value[0]?.id ?? currentChatId.value)
    }
  }

  const reset = (): void => {
    for (const chatId of [...chatInstances.keys()]) {
      disposeInstance(chatId)
    }

    restoredOnce = false
    hydratedIds.clear()
    hydrationEpoch += 1
    cancelPendingSwitch()
    currentChatId.value = readLastChatId()
    instanceGeneration.value += 1

    // The open ref may never flip again (full-page surfaces); rehydrate
    // directly so the remembered chat is never left as an empty instance
    // whose first persist would clobber the stored record.
    if (!open || open.value) {
      void hydrate()
    }
  }

  if (history) {
    if (open) {
      scope.run(() => {
        watch(
          open,
          (isOpen) => {
            if (isOpen) {
              void hydrate()
            }
          },
          { immediate: true },
        )
      })
    } else {
      // No panel to wait for: hydrate immediately so the remembered chat is
      // never persist-clobbered by a message sent before its record loaded.
      void hydrate()
    }
  }

  const dispose = (): void => {
    for (const chatId of [...chatInstances.keys()]) {
      disposeInstance(chatId)
    }

    scope.stop()
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
    dispose,
  }
}
