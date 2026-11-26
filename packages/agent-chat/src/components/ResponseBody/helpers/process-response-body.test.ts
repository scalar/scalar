import { describe, expect, it } from 'vitest'

import { processResponseBody } from './process-response-body'

describe('process-response-body', () => {
  it('preserves the full quoted download filename in Agent Chat', () => {
    const { attachmentFilename } = processResponseBody({
      data: undefined,
      headers: { 'Content-Disposition': 'attachment; FILENAME="sales;100%25.xlsx"' },
    })

    expect(attachmentFilename).toBe('sales;100%25.xlsx')
  })
})
