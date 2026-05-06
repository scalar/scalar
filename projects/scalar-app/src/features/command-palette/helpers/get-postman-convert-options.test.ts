import { describe, expect, it } from 'vitest'

import { getPostmanConvertOptions } from './get-postman-convert-options'
import { pathKey } from './postman-request-tree'

describe('get-postman-convert-options', () => {
  it('uses all requests when no request keys are selected', () => {
    const options = getPostmanConvertOptions({
      mergeOperation: false,
      importPathKeys: [],
    })

    expect(options).toStrictEqual({
      document: undefined,
      mergeOperation: false,
      requestIndexPaths: undefined,
    })
  })

  it('maps selected request keys to request index paths', () => {
    const options = getPostmanConvertOptions({
      mergeOperation: true,
      importPathKeys: [pathKey([0, 1]), pathKey([2])],
    })

    expect(options).toStrictEqual({
      document: undefined,
      mergeOperation: true,
      requestIndexPaths: [[0, 1], [2]],
    })
  })
})
