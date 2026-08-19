import { type InjectionKey, type MaybeRefOrGetter, inject, provide, reactive, toValue, watchEffect } from 'vue'

/**
 * The chat copy dictionary.
 *
 * The kit ships English defaults; shells override through
 * `provideChatCopy()` — api-reference bridges its translation system,
 * guide-layout bridges its site config. Strings with `{placeholders}` are
 * expanded with `formatChatCopy()`.
 */
export type ChatCopy = {
  composer: {
    /** Per-surface placeholder; `Ask anything` is only the default key. */
    placeholder: string
    send: string
    stop: string
  }
  session: {
    newChat: string
    deleteChat: string
    deleteAllChats: string
    untitledChat: string
  }
  approval: {
    approve: string
    reject: string
    /** Names the action, e.g. `Run POST /planets?` — never a generic request. */
    runAction: string
    /** Count-aware aggregate, e.g. `Approve 3 requests`. */
    approveMany: string
  }
  status: {
    /** Active row: `Calling get_planets…` */
    calling: string
    /** Success row with result datum: `Called POST /planets · 200 OK` */
    called: string
    /** Failure row: `{verb} failed · {reason}`. */
    failed: string
    /** The no-data fallback only. */
    requestFailed: string
  }
  tool: {
    arguments: string
    result: string
    error: string
  }
  diff: {
    /** Single-line hunk label, `{line}` placeholder. */
    line: string
    /** Line-range hunk label, `{start}`/`{end}` placeholders. */
    lines: string
  }
  errors: {
    unknown: string
    retry: string
    copy: string
  }
  disclaimer: {
    /** Default footnote under the composer; shells can clear it. */
    short: string
  }
}

/** A recursive partial of the copy dictionary, for overrides. */
export type ChatCopyOverride = {
  [Section in keyof ChatCopy]?: Partial<ChatCopy[Section]>
}

export const defaultChatCopy: ChatCopy = {
  composer: {
    placeholder: 'Ask anything',
    send: 'Send',
    stop: 'Stop',
  },
  session: {
    newChat: 'New chat',
    deleteChat: 'Delete chat',
    deleteAllChats: 'Delete all chats',
    untitledChat: 'Untitled chat',
  },
  approval: {
    approve: 'Approve',
    reject: 'Reject',
    runAction: 'Run {action}?',
    approveMany: 'Approve {count} requests',
  },
  status: {
    calling: 'Calling {tool}…',
    called: 'Called {tool}',
    failed: '{verb} failed · {reason}',
    requestFailed: 'Request failed',
  },
  tool: {
    arguments: 'Arguments',
    result: 'Result',
    error: 'Error',
  },
  diff: {
    line: 'Line {line}',
    lines: 'Lines {start}–{end}',
  },
  errors: {
    unknown: 'Something went wrong. Please try again.',
    retry: 'Retry',
    copy: 'Copy',
  },
  disclaimer: {
    short: 'AI-generated — verify important details',
  },
}

export const CHAT_COPY_KEY: InjectionKey<ChatCopy> = Symbol('chat-copy')

/** Merge an override into the defaults, section by section. */
export const mergeChatCopy = (override: ChatCopyOverride = {}): ChatCopy => {
  const merged = {} as ChatCopy

  for (const section of Object.keys(defaultChatCopy) as (keyof ChatCopy)[]) {
    merged[section] = {
      ...defaultChatCopy[section],
      ...override[section],
    } as never
  }

  return merged
}

/**
 * Provide a (partially overridden) copy dictionary to the subtree.
 *
 * The provided object is reactive and re-merges when the override source
 * changes — shells that switch locale at runtime (the api-reference
 * translation bridge) update every consumer without a remount. Pass a getter
 * for a reactive source.
 */
export const provideChatCopy = (override: MaybeRefOrGetter<ChatCopyOverride> = {}): ChatCopy => {
  const merged = reactive(mergeChatCopy(toValue(override))) as ChatCopy

  watchEffect(() => {
    const next = mergeChatCopy(toValue(override))

    for (const section of Object.keys(next) as (keyof ChatCopy)[]) {
      Object.assign(merged[section], next[section])
    }
  })

  provide(CHAT_COPY_KEY, merged)
  return merged
}

/** Read the active copy dictionary; falls back to the defaults outside a provider. */
export const useChatCopy = (): ChatCopy => inject(CHAT_COPY_KEY, defaultChatCopy)

/** Expand `{placeholders}` in a copy string. */
export const formatChatCopy = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
