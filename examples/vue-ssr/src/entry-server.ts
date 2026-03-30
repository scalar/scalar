import { generateBodyScript, renderApiReferenceToString } from '@scalar/api-reference/ssr'
import styles from '@scalar/api-reference/style.css?inline'

import { config } from './config'

export async function render(_url: string) {
  const html = await renderApiReferenceToString(config)
  const bodyScript = generateBodyScript(config)

  return { html, bodyScript, head: `<style>${styles}</style>` }
}
