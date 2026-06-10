import type { XScalarSdkInstallation } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-sdk-installation'

/** The array shape stored under `x-scalar-sdk-installation`. */
type SdkInstallationList = NonNullable<XScalarSdkInstallation['x-scalar-sdk-installation']>

/** A renderable SDK entry whose `description` is the resolved text to show. */
type RenderableSdk = {
  lang: string
  description: string
}

const fenceStart = /^\s*(`{3,}|~{3,})/

/**
 * Collapse Markdown fenced code blocks to their contents so SDK installation
 * instructions render like the generic client-library footer instead of a
 * highlighted Markdown code block.
 */
const textFromMarkdown = (markdown: string): string => {
  const lines = markdown.split('\n')
  const text: string[] = []
  let fence: { marker: '`' | '~'; length: number } | undefined

  for (const line of lines) {
    if (fence) {
      const closingFence = new RegExp(`^\\s*\\${fence.marker}{${fence.length},}\\s*$`)

      if (closingFence.test(line)) {
        fence = undefined
        continue
      }

      text.push(line)
      continue
    }

    const openingFence = line.match(fenceStart)

    if (openingFence?.[1]) {
      fence = {
        marker: openingFence[1][0] as '`' | '~',
        length: openingFence[1].length,
      }
      continue
    }

    text.push(line)
  }

  return text.join('\n').trim()
}

/**
 * The SDK installation entries that actually have something to render, each
 * resolved to a single plain-text `description`.
 *
 * A `description` is the promoted content, but the legacy `source` install
 * command is still supported: when both are present it is appended to the text,
 * and when only `source` is present it becomes the description on its own.
 * Entries that carry neither are ignored so the UI can fall back to the generic
 * client selector instead of showing an empty card. Both the gate in
 * `Content.vue` and the tab list in the block rely on this, so the "has
 * instructions" rule lives in one place.
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

        const description =
          typeof sdk.description === 'string' && sdk.description.trim() ? textFromMarkdown(sdk.description) : ''
        const source = typeof sdk.source === 'string' ? sdk.source.trim() : ''

        if (!description && !source) {
          return []
        }

        const resolved = [description, source].filter(Boolean).join('\n')

        return [{ lang: sdk.lang, description: resolved }]
      })
    : []
