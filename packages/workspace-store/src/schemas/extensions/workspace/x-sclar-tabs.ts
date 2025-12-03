import { Type } from '@scalar/typebox'

type TabIcon = 'request' | 'document'

const TabSchema = Type.Object({
  path: Type.String(),
  title: Type.String(),
  icon: Type.Optional(Type.String()),
})

export type Tab = {
  path: string
  title: string
  icon?: TabIcon
}

/**
 * Schema for workspace tab configuration.
 *
 * This extension allows storing the list of open tabs and which tab is currently active.
 * Useful for preserving user's workspace state across sessions.
 */
export const XScalarTabsSchema = Type.Object({
  /** Array of tab identifiers that are currently open in the workspace */
  'x-scalar-tabs': Type.Optional(Type.Array(TabSchema)),
  /** The identifier of the currently active/focused tab */
  'x-scalar-active-tab': Type.Optional(Type.Number()),
})

/**
 * TypeScript type for workspace tab configuration.
 *
 * Used to persist which tabs are open and which one is active,
 * allowing users to restore their workspace state when returning to the application.
 */
export type XScalarTabs = {
  /** Array of tab identifiers that are currently open in the workspace */
  'x-scalar-tabs'?: Tab[]
  /** The identifier of the currently active/focused tab */
  'x-scalar-active-tab'?: number
}
