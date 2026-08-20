import { type Ref, effectScope, ref, watch } from 'vue'

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
   * The index is created when the database (or a version upgrade) creates the
   * store; for a pre-existing database that never had the index — IndexedDB
   * cannot add one outside a version upgrade — reads fall back to a full
   * scan filtered in memory, so shipped histories stay visible either way.
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
  /** Stop the adapter's scope watcher. Call when the owning surface is torn down for good. */
  dispose: () => void
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

        const store = db.objectStoreNames.contains(storeName)
          ? // A version upgrade against an existing store (only possible here
            // when `version` is raised) can still gain the scope index.
            (request.transaction?.objectStore(storeName) ?? undefined)
          : db.createObjectStore(storeName, { keyPath: 'id' })

        if (scope && store && !store.indexNames.contains(scope.indexName)) {
          store.createIndex(scope.indexName, scope.indexName, { unique: false })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      // A version upgrade (raising `version` to add the scope index) while
      // another tab holds the database open fires `blocked`, and the request
      // then neither succeeds nor errors — reject so `withStore` fails fast
      // instead of hanging every read and write forever.
      request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another open connection'))
    })

  const withStore = async <T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> => {
    const db = await openDb()

    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode)
        const request = operation(transaction.objectStore(storeName))

        if (mode === 'readwrite') {
          // Writes resolve on commit, not on request success: a commit-time
          // abort (for example QuotaExceededError) rolls the write back
          // after the request already reported success.
          transaction.oncomplete = () => resolve(request.result)
          transaction.onerror = () => reject(transaction.error)
          transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
        } else {
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        }
      })
    } finally {
      db.close()
    }
  }

  const readAllRaw = async (): Promise<unknown[]> => {
    if (!scope) {
      return await withStore('readonly', (store) => store.getAll())
    }

    try {
      return await withStore('readonly', (store) =>
        store.index(scope.indexName).getAll(IDBKeyRange.only(scope.value.value)),
      )
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'NotFoundError')) {
        throw error
      }

      // The store predates the index (created by an older client) and
      // IndexedDB cannot add one outside a version upgrade: scan and filter.
      const all = await withStore('readonly', (store) => store.getAll())

      return (all as unknown[]).filter(
        (record) =>
          typeof record === 'object' &&
          record !== null &&
          (record as Record<string, unknown>)[scope.indexName] === scope.value.value,
      )
    }
  }

  const readAll = async (): Promise<StoredChat[]> =>
    (await readAllRaw()).map(normalizeRecord).filter((record): record is StoredChat => record !== undefined)

  const sortList = (records: StoredChat[]): StoredChat[] =>
    [...records].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))

  /**
   * Guards every whole-list assignment. Deletions, clears and newer
   * refreshes bump it, so a slow read that started earlier can never
   * overwrite the list with a stale snapshot (ghost-resurrecting deleted
   * rows, or showing the previous scope's records after a scope switch).
   */
  let listGeneration = 0

  const refresh = async (): Promise<void> => {
    if (isServer) {
      return
    }

    const generation = ++listGeneration

    try {
      const records = sortList(await readAll())

      if (generation !== listGeneration) {
        return
      }

      chatList.value = records
    } catch (error) {
      console.warn('Failed to load chat history', error)

      if (generation === listGeneration) {
        chatList.value = []
      }
    }
  }

  /**
   * Deletion wins over in-flight saves. A save whose `put` commits after the
   * record was deleted (or after `clearAll` started) would otherwise
   * resurrect it — in the store and in the list. Ids are UUIDs and never
   * reused, so tombstones are permanent within the session.
   */
  const deletedIds = new Set<string>()
  let clearEpoch = 0

  const saveChat = async (chat: StoredChat): Promise<void> => {
    if (isServer) {
      return
    }

    const epochAtWrite = clearEpoch
    const generationAtWrite = listGeneration

    try {
      await withStore('readwrite', (store) => store.put(chat))

      if (epochAtWrite !== clearEpoch || deletedIds.has(chat.id)) {
        // The chat was deleted while the write was in flight: undo it.
        await withStore('readwrite', (store) => store.delete(chat.id))
        return
      }

      if (generationAtWrite !== listGeneration) {
        // A delete or a scope-switch refresh reshaped the list while the write
        // was in flight. The store now holds the record correctly, but the
        // in-memory list belongs to a newer generation (a different scope, or
        // one a delete already filtered) — splicing this record in from the
        // stale generation could leak it across scopes. Leave the list to the
        // authoritative refresh; the store is already correct.
        return
      }

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

    deletedIds.add(id)

    try {
      await withStore('readwrite', (store) => store.delete(id))
      listGeneration += 1
      chatList.value = chatList.value.filter((chat) => chat.id !== id)
    } catch (error) {
      // The record survived: roll the tombstone back so the still-alive
      // chat's future saves are not silently discarded.
      deletedIds.delete(id)
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

    // Discard saves in flight for records the list does not know about yet
    // (a brand-new chat's first persist has no tombstone to hit), and stale
    // refreshes that would repopulate the list mid-clear.
    clearEpoch += 1
    listGeneration += 1

    // Serial per-record deletes, scope-aware: with a scope configured this
    // must not wipe other scopes' records, so there is no store.clear().
    for (const chat of [...chatList.value]) {
      await deleteChat(chat.id)
    }

    if (!chatList.value.length) {
      return
    }

    // Some deletes failed and rolled back — reflect reality instead of
    // clearing a list whose records still exist.
    await refresh()
  }

  const ready = ref<Promise<void>>(refresh())

  // Detached scope: the adapter outlives whichever component happens to
  // create it, so the scope watcher must not die with that component —
  // but a torn-down surface must be able to stop it, or every recreated
  // adapter stays subscribed to the shell's scope ref forever.
  const watcherScope = effectScope(true)

  if (scope) {
    watcherScope.run(() => {
      watch(scope.value, () => {
        ready.value = refresh()
      })
    })
  }

  const dispose = (): void => {
    watcherScope.stop()
  }

  return { chatList, ready, refresh, saveChat, deleteChat, loadChat, clearAll, dispose }
}
