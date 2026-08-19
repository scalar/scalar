import type { InjectionKey, Ref } from 'vue'

/**
 * The one sanctioned density axis of the chat system.
 *
 * `default` is the full-page reading density (agent chat, docs panel,
 * api-reference drawer). `compact` is the work-surface density (MCP rail,
 * editor panel). Primitives read the CSS variables below and never branch on
 * surface names — density variables are the only density control.
 */
export type ChatDensity = 'default' | 'compact'

/**
 * The chat-scoped CSS variables per density.
 *
 * Font sizes reference the theme scale so they track theme overrides;
 * geometry values are fixed by the design direction. Constant across both
 * densities (and therefore not variables): chip and code sizes, icon sizing,
 * 28px controls, radius language, and all colors.
 */
export const chatDensityVariables: Record<ChatDensity, Record<string, string>> = {
  default: {
    '--chat-font-prose': 'var(--scalar-font-size-2)',
    '--chat-font-row': 'var(--scalar-font-size-3)',
    '--chat-font-meta': 'var(--scalar-font-size-4)',
    '--chat-row-min-h': '40px',
    '--chat-bubble-max-w': '80%',
    '--chat-bubble-padding': '6px 16px',
    '--chat-anchor-gap': '16px',
  },
  compact: {
    '--chat-font-prose': 'var(--scalar-font-size-3)',
    '--chat-font-row': 'var(--scalar-font-size-4)',
    '--chat-font-meta': 'var(--scalar-font-size-5)',
    '--chat-row-min-h': '32px',
    '--chat-bubble-max-w': '90%',
    '--chat-bubble-padding': '6px 12px',
    '--chat-anchor-gap': '16px',
  },
}

/** The empty-state layout each density defaults to. */
export const chatEmptyLayoutForDensity: Record<ChatDensity, 'hero' | 'list'> = {
  default: 'hero',
  compact: 'list',
}

export const CHAT_DENSITY_KEY: InjectionKey<Ref<ChatDensity>> = Symbol('chat-density')
