import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { renderToString } from '@vue/server-renderer'
import { expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'

import Message from './Message.vue'

const MESSAGE_ID = 'doc/channel/userSignedUp/operation/onUserSignedUp/message/userSignedUp'

const message: TraversedAsyncApiMessage = {
  type: 'asyncapi-message',
  id: MESSAGE_ID,
  title: 'User signed up',
  messageName: 'userSignedUp',
  channelName: 'userSignedUp',
}

const document = {
  asyncapi: '3.0.0',
  info: { title: 'Streaming API', version: '1.0.0' },
  'x-scalar-original-document-hash': '',
  channels: {
    userSignedUp: {
      address: 'user/signedup',
      messages: { userSignedUp: { payload: { type: 'string' } } },
    },
  },
} as AsyncApiDocument

/** The deepest nesting of `button` elements the markup reaches. */
const maxButtonDepth = (html: string) => {
  let depth = 0
  let deepest = 0

  for (const tag of html.matchAll(/<(\/?)button[\s/>]/g)) {
    depth += tag[1] ? -1 : 1
    deepest = Math.max(deepest, depth)
  }

  return deepest
}

/**
 * A `button` start tag inside an open `button` implies the end tag for the outer one, so the
 * parser re-parents the inner control as a sibling and the hydrated DOM can never match the
 * rendered tree. The accordion header and the copy-link button it holds must therefore stay
 * separate buttons.
 */
it('renders the message header without nesting buttons', async () => {
  const html = await renderToString(createSSRApp({ render: () => h(Message, { message, document, eventBus: null }) }))

  expect(html).toContain('<button')
  expect(maxButtonDepth(html)).toBe(1)
})
