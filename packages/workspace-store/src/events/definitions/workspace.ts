import type { ColorMode } from '@/schemas/workspace'

/** Event definitions for the openapi document */
export type WorkspaceEvents = {
  /**
   * Update the active proxy
   */
  'workspace:update:active-proxy': string | null
  /**
   * Update the color mode of the workspace
   */
  'workspace:update:color-mode': ColorMode
  /**
   * Update the theme of the workspace
   */
  'workspace:update:theme': string | undefined // theme slug
  /**
   * Update the selected client on the workspace.
   * Either a built-in client id (e.g. `js/fetch`) or a custom sample id (e.g. `custom/python`).
   *
   * Typed as a plain string: unioning the custom ids with the large client-id union trips
   * TypeScript's "union too complex" limit when this event map is embedded in a Vue
   * `defineProps`. The set of valid values is enforced at runtime instead.
   */
  'workspace:update:selected-client': string
  /**
   * Update the selected example on the workspace.
   *
   * The payload is an example key (from an operation's `examples` map). Sharing it across the
   * document keeps request and response example pickers in sync between operations: picking
   * "Use case 1" on one operation selects the example with the same key everywhere it exists.
   */
  'workspace:update:selected-example': string
  /**
   * Update the active environment on the workspace
   */
  'workspace:update:active-environment': string | null
  /**
   * Update the dispaly name of the workspace
   */
  'workspace:update:name': string
}
