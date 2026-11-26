import { describe, expect, it } from 'vitest'

import { getIdFromUrl, makeUrlFromId } from './id-routing'
import { parseResponsePropertyAnchor, qualifyResponsePropertyAnchor } from './response-property-anchors'

describe('response-property-anchors', () => {
  it.each([undefined, '#docs', '/docs'])('round-trips a media type through routing at %s', (basePath) => {
    const responseId = 'orders/GET/orders.responses.2XX'
    const id = responseId + '.order.item'
    const mediaType = 'application/vnd.example+json; profile="https://example.com/a~b?[q]#x"'

    const qualified = qualifyResponsePropertyAnchor(id, responseId, mediaType)
    const url = makeUrlFromId(qualified, basePath, false)!
    const routed = getIdFromUrl(url, basePath, 'orders')

    expect(parseResponsePropertyAnchor(routed)).toStrictEqual({ id, mediaType })
  })

  it.each([
    'orders/GET/orders.responses.200.status',
    'orders/GET/orders.responses.default.headers.X-Rate-Limit',
    'orders/GET/orders.responses.200[media=application~ZZxml].status',
    'orders/GET/orders.responses.200.nested.responses.200[media=application~2Fxml].status',
  ])('preserves the original anchor %s', (id) => {
    expect(parseResponsePropertyAnchor(id)).toStrictEqual({ id })
  })
})
