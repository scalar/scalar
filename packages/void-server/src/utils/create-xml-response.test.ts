import type { Context } from 'hono'
import { describe, expect, it } from 'vitest'

import { createMockContext } from '../../test/utils/create-mock-context'
import { createXmlResponse } from './create-xml-response'

describe('create-xml-response', () => {
  it('sets the content-type header to application/xml', () => {
    const mockContext = createMockContext()

    createXmlResponse(mockContext as unknown as Context, { message: 'hello' })

    expect(mockContext._headers['Content-Type']).toBe('application/xml; charset=UTF-8')
  })

  it('converts a simple object to XML format', () => {
    const mockContext = createMockContext()

    createXmlResponse(mockContext as unknown as Context, { greeting: 'hello' })

    const textContent = mockContext._getTextContent()
    expect(textContent).toContain('<greeting>hello</greeting>')
  })

  it('converts a nested object to XML format', () => {
    const mockContext = createMockContext()
    const nestedData = {
      user: {
        name: 'John',
        age: 30,
      },
    }

    createXmlResponse(mockContext as unknown as Context, nestedData)

    const textContent = mockContext._getTextContent()
    expect(textContent).toContain('<user>')
    expect(textContent).toContain('<name>John</name>')
    expect(textContent).toContain('<age>30</age>')
    expect(textContent).toContain('</user>')
  })
})
