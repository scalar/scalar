import { describe, expect, it } from 'vitest'

import type { Item } from '@/types'

import { extractStatusCodesFromTests } from './status-codes'

describe('status-codes', () => {
  it('extracts status code from pm.response.to.have.status pattern', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.response.to.have.status(201);'],
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([201])
  })

  it('extracts status code from pm.expect(pm.response.code).to.eql pattern', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.expect(pm.response.code).to.eql(202);'],
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([202])
  })

  it('extracts status code from pm.expect(pm.response.code).to.equal pattern', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.expect(pm.response.code).to.equal(203);'],
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([203])
  })

  it('extracts status code from pm.expect(pm.response.status).to.equal pattern with string', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.expect(pm.response.status).to.equal("201");'],
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([201])
  })

  it('extracts multiple status codes from multiple test lines', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.response.to.have.status(200);',
              'pm.expect(pm.response.code).to.eql(201);',
              'pm.expect(pm.response.status).to.equal("202");',
            ],
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([200, 201, 202])
  })

  it('extracts status codes from multiple test events', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.response.to.have.status(200);'],
          },
        },
        {
          listen: 'test',
          script: {
            exec: ['pm.response.to.have.status(201);'],
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([200, 201])
  })

  it('returns empty array when no test events are present', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'prerequest',
          script: {
            exec: ['console.log("pre");'],
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([])
  })

  it('returns empty array when events array is missing', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([])
  })

  it('returns empty array when script exec is missing', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {},
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([])
  })

  it('handles script exec as string', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: 'pm.response.to.have.status(200);',
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([200])
  })

  it('ignores non-matching patterns', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.test("Status is OK", function () {', '  console.log("test");', '});'],
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([])
  })

  it('deduplicates status codes', () => {
    const item: Item = {
      name: 'Test Request',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.response.to.have.status(200);', 'pm.response.to.have.status(200);'],
          },
        },
      ],
    }

    const result = extractStatusCodesFromTests(item)

    expect(result).toEqual([200, 200])
  })
})
