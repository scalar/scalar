import type { EnvironmentEvents } from '@/events/definitions/environment'
import type { TabEvents } from '@/events/definitions/tabs'

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
  DocumentEvents &
  EnvironmentEvents &
  MetaEvents &
  OperationEvents &
  ServerEvents &
  TabEvents &
  UIEvents

export type { CollectionType } from './common'
