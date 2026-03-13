import { renderApiReferenceToString } from '@scalar/api-reference/ssr'
import styles from '@scalar/api-reference/style.css?inline'

export async function render(_url: string) {
  const { html, bodyClass, bodyScript } = await renderApiReferenceToString({
    url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
  })

  return { html, bodyClass, bodyScript, head: `<style>${styles}</style>` }
}
