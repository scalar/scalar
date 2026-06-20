import type { ReleaseNotesConfig } from './types'

/**
 * Identity helper that gives JavaScript and TypeScript config files strong editor types.
 */
export const defineReleaseNotesConfig = (config: ReleaseNotesConfig): ReleaseNotesConfig => config
