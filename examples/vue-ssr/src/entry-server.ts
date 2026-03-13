import { generateBodyScript, renderApiReferenceToString } from '@scalar/api-reference/ssr'
import styles from '@scalar/api-reference/style.css?inline'

export async function render(_url: string) {
  const config = { url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json' }
  const html = await renderApiReferenceToString(config)
  const bodyScript = generateBodyScript(config)

  return { html, bodyScript, head: `<style>${styles}</style>` }
}
