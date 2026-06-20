import { defineReleaseNotesConfig } from './packages/release-notes/dist/index.js'
import { scalarReleaseNotesConfig } from './packages/release-notes/dist/scalar-preset.js'

export default defineReleaseNotesConfig(scalarReleaseNotesConfig)
