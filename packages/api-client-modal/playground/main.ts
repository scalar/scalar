import { createScalarApiClient } from '@/api-client-modal'
// @ts-expect-error Just doesn't like raw for some reason
import content from '@scalar/galaxy/latest.json?raw'

const el = document.getElementById('root')
console.log(el)

if (el) {
  const { open } = await createScalarApiClient(el, {
    spec: { content },
  })
  open()
}
