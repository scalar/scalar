import type { XScalarSdkInstallation } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-sdk-installation'

/** The array shape stored under `x-scalar-sdk-installation`. */
type SdkInstallationList = NonNullable<XScalarSdkInstallation['x-scalar-sdk-installation']>

/** A renderable SDK entry whose `description` is the resolved Markdown to show. */
type RenderableSdk = {
  lang: string
  description: string
}

/**
 * Wrap a raw install command in a fenced code block.
 *
 * The fence uses a run of backticks longer than the longest run inside the
 * source, so a `source` that itself contains backticks (or a nested fence)
 * still renders as a single code block instead of breaking out of it.
 */
const toFencedCodeBlock = (source: string): string => {
  const longestRun = Math.max(0, ...[...source.matchAll(/`+/g)].map((match) => match[0].length))
  const fence = '`'.repeat(Math.max(3, longestRun + 1))

  return `${fence}\n${source}\n${fence}`
}

/**
 * The SDK installation entries that actually have something to render, each
 * resolved to a single Markdown `description`.
 *
 * A `description` is the promoted content, but the legacy `source` install
 * command is still supported: when both are present it is appended to the
 * description as a fenced code block, and when only `source` is present it
 * becomes the description on its own. Entries that carry neither are ignored so
 * the UI can fall back to the generic client selector instead of showing an
 * empty card. Both the gate in `Content.vue` and the tab list in the block rely
 * on this, so the "has instructions" rule lives in one place.
 *
 * The value comes straight from an untrusted OpenAPI document, so anything
 * malformed — a non-array extension, a non-object entry, or an entry missing a
 * string `lang` (the tab label and icon key) and any content — is treated as
 * "no instructions" rather than allowed to throw at render time.
 */
export const getRenderableSdks = (xScalarSdkInstallation: SdkInstallationList | undefined): RenderableSdk[] =>
  Array.isArray(xScalarSdkInstallation)
    ? xScalarSdkInstallation.flatMap((sdk) => {
        if (typeof sdk?.lang !== 'string') {
          return []
        }

        const description = typeof sdk.description === 'string' ? sdk.description.trim() : ''
        const source = typeof sdk.source === 'string' ? sdk.source.trim() : ''

        if (!description && !source) {
          return []
        }

        const resolved = [description, source && toFencedCodeBlock(source)].filter(Boolean).join('\n\n')

        return [{ lang: sdk.lang, description: resolved }]
      })
    : []
