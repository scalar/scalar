import { createScalarClient } from '@/api-client-modal'
import content from '@scalar/galaxy/latest.json?raw'

const el = document.getElementById('root')
console.log(el)

const { open } = await createScalarClient(el, {
  spec: { content },
})
