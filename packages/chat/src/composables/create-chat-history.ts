import { type Ref, ref, watch } from 'vue'

/**
 * The persisted chat record. Extra fields (for example the editor's
 * `projectUid` and `mode`) ride along untouched — the adapter never strips
 * what it does not know.
 */
export type StoredChat = {
  id: string
  title: string
  messages: unknown[]
  createdAt: number
  updatedAt: number
} & Record<string, unknown>

export type ChatHistoryOptions = {
  /**
   * The IndexedDB database name. Existing surfaces MUST keep their shipped
   * names (`scalar-agent-chat` for the docs panel, `scalar-editor-agent-chat`
   * for the editor) — a fresh name would orphan every visitor's history.
   */
  dbName: string
  /** Object store name. Every shipped surface uses `chats`. */
  storeName?: string
  /** Database version. Every shipped surface is at 1. */
  version?: number
  /**
   * Scope records by an indexed field, like the editor's `projectUid`.
   * The index is created on upgrade; reads filter with `IDBKeyRange.only`.
   * When the value changes, the list reloads and `ready` is reassigned.
   */
  scope?: {
    indexName: string
    value: Ref<string>
  }
  /** List sort field, newest first. The docs panel sorts by `createdAt`, the editor by `updatedAt`. */
  sortBy?: 'createdAt' | 'updatedAt'
  /** Skip all storage access during SSR/SSG rendering. */
  isServer?: boolean
}

export type ChatHistory = {
  chatList: Ref<StoredChat[]>
  /** Await before first read. A `Ref` because scope changes reassign it. */
  ready: Ref<Promise<void>>
  refresh: () => Promise<void>
  saveChat: (chat: StoredChat) => Promise<void>
  deleteChat: (id: string) => Promise<void>
  loadChat: (id: string) => Promise<StoredChat | undefined>
  clearAll: () => Promise<void>
}

/**
 * Migrate-on-read: tolerate any record shape older clients persisted.
 * Never bulk-rewrite the store — normalizing happens per record, per read.
 */
const normalizeRecord = (record: unknown): StoredChat | undefined => {
  if (typeof record !== 'object' || record === null || typeof (record as { id?: unknown }).id !== 'string') {
    return undefined
  }

  const raw = record as Record<string, unknown>

  return {
    ...raw,
    id: raw.id as string,
    title: typeof raw.title === 'string' ? raw.title : '',
    messages: Array.isArray(raw.messages) ? raw.messages : [],
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : 0,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  }
}

/**
 * IndexedDB-backed chat history, ported from the two org implementations
 * (guide-layout `useChatHistory`, dashboard `useEditorAgentHistory`) and
 * parameterized over their divergences. Storage errors are swallowed into
 * warnings — history is an enhancement, never a gate on chatting.
 */
export const createChatHistory = (options: ChatHistoryOptions): ChatHistory => {
  const { dbName, storeName = 'chats', version = 1, scope, sortBy = 'updatedAt', isServer = false } = options

  const chatList = ref<StoredChat[]>([])

  const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version)

      request.onupgradeneeded = () => {
        const db = request.result

        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' })

          if (scope) {
            store.createIndex(scope.indexName, scope.indexName, { unique: false })
          }
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

  const withStore = async <T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> => {
    const db = await openDb()

    try {
      return await new Promise<T>((resolve, reject) => {
        const request = operation(db.transaction(storeName, mode).objectStore(storeName))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } finally {
      db.close()
    }
  }

  const readAll = async (): Promise<StoredChat[]> => {
    const records = await withStore('readonly', (store) => {
      if (scope) {
        return store.index(scope.indexName).getAll(IDBKeyRange.only(scope.value.value))
      }

      return store.getAll()
    })

    return (records as unknown[]).map(normalizeRecord).filter((record): record is StoredChat => record !== undefined)
  }

  const sortList = (records: StoredChat[]): StoredChat[] =>
    [...records].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))

  const refresh = async (): Promise<void> => {
    if (isServer) {
      return
    }

    try {
      chatList.value = sortList(await readAll())
    } catch (error) {
      console.warn('Failed to load chat history', error)
      chatList.value = []
    }
  }

  const saveChat = async (chat: StoredChat): Promise<void> => {
    if (isServer) {
      return
    }

    try {
      await withStore('readwrite', (store) => store.put(chat))

      const index = chatList.value.findIndex((existing) => existing.id === chat.id)

      if (index === -1) {
        chatList.value = sortList([chat, ...chatList.value])
      } else {
        const next = [...chatList.value]
        next[index] = chat
        chatList.value = sortList(next)
      }
    } catch (error) {
      console.warn('Failed to save chat', error)
    }
  }

  const deleteChat = async (id: string): Promise<void> => {
    if (isServer) {
      return
    }

    try {
      await withStore('readwrite', (store) => store.delete(id))
      chatList.value = chatList.value.filter((chat) => chat.id !== id)
    } catch (error) {
      console.warn('Failed to delete chat', error)
    }
  }

  const loadChat = async (id: string): Promise<StoredChat | undefined> => {
    if (isServer) {
      return undefined
    }

    try {
      return normalizeRecord(await withStore('readonly', (store) => store.get(id)))
    } catch {
      return undefined
    }
  }

  const clearAll = async (): Promise<void> => {
    if (isServer) {
      return
    }

    // Serial per-record deletes, scope-aware: with a scope configured this
    // must not wipe other scopes' records, so there is no store.clear().
    for (const chat of [...chatList.value]) {
      await deleteChat(chat.id)
    }

    chatList.value = []
  }

  const ready = ref<Promise<void>>(refresh())

  if (scope) {
    watch(scope.value, () => {
      ready.value = refresh()
    })
  }

  return { chatList, ready, refresh, saveChat, deleteChat, loadChat, clearAll }
}
