import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { Target } from '@scalar/snippetz'
import { clients } from '@scalar/snippetz/clients'

/**
 * Generator script to update the hiddenClients documentation in configuration.md
 * with the current list of available clients from the TypeScript source.
 */

const CONFIG_MD_PATH = resolve(__dirname, '../../../documentation/configuration.md')
const START_MARKER = '<!-- AUTO-GENERATED:CLIENTS START -->'
const END_MARKER = '<!-- AUTO-GENERATED:CLIENTS END -->'

/**
 * Generates the markdown content for the hiddenClients documentation.
 * Groups clients by target/language with comments.
 */
function generateClientsDocumentation(targets: Target[]): string {
  // Sort targets by key for consistent order
  const sortedTargets = [...targets].sort((a, b) => a.key.localeCompare(b.key))

  const lines: string[] = []
  lines.push('```js')
  lines.push('{')
  lines.push('  hiddenClients: {')

  for (const target of sortedTargets) {
    // Sort clients within each target for consistent order
    const sortedClients = [...target.clients]
      .sort((a, b) => a.client.localeCompare(b.client))
      .map((client) => `'${client.client}'`)

    // Add comment with target title
    lines.push(`    // ${target.title}`)
    // Add target key with array of clients
    lines.push(`    ${target.key}: [${sortedClients.join(', ')}],`)
  }

  lines.push('  }')
  lines.push('}')
  lines.push('```')

  return lines.join('\n')
}

/**
 * Updates the configuration.md file with the generated documentation.
 */
function updateConfigurationMd(): void {
  try {
    // Read the current file
    const content = readFileSync(CONFIG_MD_PATH, 'utf-8')

    // Find the markers
    const startIndex = content.indexOf(START_MARKER)
    const endIndex = content.indexOf(END_MARKER)

    if (startIndex === -1 || endIndex === -1) {
      throw new Error(
        `Could not find markers in ${CONFIG_MD_PATH}. Make sure both ${START_MARKER} and ${END_MARKER} are present.`,
      )
    }

    if (startIndex >= endIndex) {
      throw new Error(`Start marker appears after end marker in ${CONFIG_MD_PATH}`)
    }

    // Parse clients from import
    const sortedTargets = [...clients].sort((a, b) => a.key.localeCompare(b.key))

    // Generate the new content
    const generatedContent = generateClientsDocumentation(sortedTargets)

    // Build the new section with markers and comments
    const newSection = [
      START_MARKER,
      '<!-- This section is automatically generated. Do not edit manually. -->',
      '<!-- Source: packages/snippetz/src/clients/index.ts -->',
      '<!-- Generator: packages/snippetz/scripts/generate-markdown-docs.ts -->',
      '',
      generatedContent,
      '',
      END_MARKER,
    ].join('\n')

    // Replace the content between markers
    const before = content.substring(0, startIndex)
    const after = content.substring(endIndex + END_MARKER.length)

    const newContent = before + newSection + after

    // Write the updated file
    writeFileSync(CONFIG_MD_PATH, newContent, 'utf-8')

    console.log(`Successfully updated ${CONFIG_MD_PATH}`)
    console.log(`Generated documentation for ${sortedTargets.length} targets`)
  } catch (error) {
    console.error('Error generating markdown documentation:', error)
    process.exit(1)
  }
}

/**
 * Main function
 */
function main(): void {
  // Skip generation in CI environments
  if (process.env.CI) {
    console.log('Skipping markdown documentation generation in CI environment')
    return
  }

  updateConfigurationMd()
}

main()
