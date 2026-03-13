import { renderApiReferenceToString } from '@scalar/api-reference/ssr'
import styles from '@scalar/api-reference/style.css?inline'

export async function render(_url: string) {
  const html = await renderApiReferenceToString({
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
  })

  return { html, head: `<style>${styles}</style>` }
}
