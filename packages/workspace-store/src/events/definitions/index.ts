import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

import type { AnalyticsEvents } from './analytics'
import type { AuthEvents } from './auth'
import type { MetaEvents } from './meta'
import type { OperationEvents } from './operation'
import type { ServerEvents } from './server'
import type { UIEvents } from './ui'

export type ApiReferenceEvents<T extends keyof ServerObject = keyof ServerObject> = AuthEvents &
  AnalyticsEvents &
  UIEvents &
  ServerEvents<T> &
  OperationEvents &
  MetaEvents
