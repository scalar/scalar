import { themeIds } from '@scalar/themes'
import { z } from 'zod'

import { type ENTITY_BRANDS, nanoidSchema } from '@scalar/types/utils'
import { HOTKEY_EVENT_NAMES, KEYDOWN_KEYS } from '../hotkeys/hotkeys'

const modifier = z
  .enum(['Meta', 'Control', 'Shift', 'Alt', 'default'] as const)
  .optional()
  .default('default')
const modifiers = z.array(modifier).optional().default(['default'])

export type HotKeyModifiers = z.infer<typeof modifiers>

const hotKeys = z.record(
  z.enum(KEYDOWN_KEYS),
  z.object({
    modifiers: modifiers.optional(),
    event: z.enum(HOTKEY_EVENT_NAMES),
  }),
)
export type HotKeyConfig = z.infer<typeof hotKeys>

const hotKeyConfigSchema = z
  .object({
    modifiers,
    hotKeys: hotKeys.optional(),
  })
  .optional()

export const workspaceSchema = z.object({
  uid: nanoidSchema.brand<ENTITY_BRANDS['WORKSPACE']>(),
  name: z.string().default('Default Workspace'),
  /** Workspace description */
  description: z.string().default('Basic Scalar Workspace'),
  /** List of all collection uids in a given workspace */
  collections: z.array(z.string().brand<ENTITY_BRANDS['COLLECTION']>()).default([]),
  /** List of all environment uids in a given workspace, TODO: why is this a record? */
  environments: z.record(z.string()).default({}),
  /** Customize hotkeys */
  hotKeyConfig: hotKeyConfigSchema,
  /** Active Environment ID to use for requests  */
  activeEnvironmentId: z.string().optional().default('default'),
  /** List of all cookie uids in a given workspace */
  cookies: z.array(z.string().brand<ENTITY_BRANDS['COOKIE']>()).default([]),
  /** Workspace level proxy for all requests to be sent through */
  proxyUrl: z.string().optional(),
  /** Workspace level theme, we might move this to user level later */
  themeId: z.enum(themeIds).optional().default('default').catch('default'),
  /** Currently selected snippet client */
  selectedHttpClient: z
    .object({
      targetKey: z.string(),
      clientKey: z.string(),
    })
    .optional()
    .default({
      targetKey: 'shell',
      clientKey: 'curl',
    }),
})

/** The base scalar workspace */
export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspacePayload = z.input<typeof workspaceSchema>
