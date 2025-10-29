import type { EnvironmentEvents } from '@/events/definitions/environment'
import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

import type { AnalyticsEvents } from './analytics'
import type { AuthEvents } from './auth'
import type { DocumentEvents } from './document'
import type { MetaEvents } from './meta'
import type { OperationEvents } from './operation'
import type { ServerEvents } from './server'
import type { UIEvents } from './ui'

export type ApiReferenceEvents<T extends keyof ServerObject = keyof ServerObject> = AuthEvents &
  AnalyticsEvents &
  DocumentEvents &
  EnvironmentEvents &
  MetaEvents &
  OperationEvents &
  ServerEvents<T> &
  UIEvents

export type { CollectionType } from './common'
