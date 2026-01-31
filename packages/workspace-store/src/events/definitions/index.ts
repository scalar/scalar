import type { EnvironmentEvents } from '@/events/definitions/environment'
import type { HooksEvents } from '@/events/definitions/hooks'
import type { TabEvents } from '@/events/definitions/tabs'
import type { TagEvents } from '@/events/definitions/tag'
import type { WorkspaceEvents } from '@/events/definitions/workspace'

import type { AnalyticsEvents } from './analytics'
import type { AuthEvents } from './auth'
import type { CookieEvents } from './cookie'
import type { DocumentEvents } from './document'
import type { MetaEvents } from './meta'
import type { OperationEvents } from './operation'
import type { ServerEvents } from './server'
import type { UIEvents } from './ui'

export type ApiReferenceEvents = AuthEvents &
  AnalyticsEvents &
  CookieEvents &
  WorkspaceEvents &
  DocumentEvents &
  EnvironmentEvents &
  MetaEvents &
  OperationEvents &
  ServerEvents &
  TabEvents &
  UIEvents &
  TagEvents &
  HooksEvents

export type { AuthMeta } from './auth'
export type { CollectionType } from './common'
export type { OperationExampleMeta, OperationMeta } from './operation'
export type { CommandPaletteAction, CommandPalettePayload, KeyboardEventPayload } from './ui'
