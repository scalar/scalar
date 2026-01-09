import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockEventBus } from '@/v2/helpers/test-utils'

import CookiesTable from './CookiesTable.vue'

const createMockCookies = (cookies: XScalarCookie[] = []): XScalarCookie[] => cookies

describe('CookiesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits event when adding a new cookie in the empty row', async () => {
    const cookies = createMockCookies([{ name: 'sessionId', value: 'abc123', domain: 'example.com' }])

    const wrapper = mount(CookiesTable, {
      props: {
        cookies,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * The component should have 4 CodeInput components for the existing cookie
     * (name, value, domain) and 3 for the empty row (name, value, domain).
     * When we update the name in the empty row, it should emit an event.
     */
    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    expect(codeInputs).toHaveLength(6)

    const emptyRowNameInput = codeInputs.at(3)!
    await emptyRowNameInput.vm.$emit('update:modelValue', 'NEW_COOKIE')

    expect(mockEventBus.emit).toHaveBeenCalledWith('cookie:upsert:cookie', {
      payload: { name: 'NEW_COOKIE', value: '', domain: '', isDisabled: false },
      collectionType: 'document',
    })
  })

  it('emits event when updating an existing cookie', async () => {
    const cookies = createMockCookies([
      { name: 'sessionId', value: 'abc123', domain: 'example.com' },
      { name: 'authToken', value: 'token456', domain: 'api.example.com' },
    ])

    const wrapper = mount(CookiesTable, {
      props: {
        cookies,
        eventBus: mockEventBus,
        collectionType: 'workspace',
      },
    })

    /**
     * When changing the value of the first cookie,
     * it should emit an update event with the index.
     * CodeInput index 1 is the value input for the first cookie row.
     */
    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    const firstValueInput = codeInputs.at(1)!
    await firstValueInput.vm.$emit('update:modelValue', 'updated-value-123')

    expect(mockEventBus.emit).toHaveBeenCalledWith('cookie:upsert:cookie', {
      payload: {
        name: 'sessionId',
        value: 'updated-value-123',
        domain: 'example.com',
        isDisabled: false,
      },
      index: 0,
      collectionType: 'workspace',
    })
  })

  it('emits event when clicking delete button on an existing cookie', async () => {
    const cookies = createMockCookies([
      { name: 'sessionId', value: 'abc123', domain: 'example.com' },
      { name: 'authToken', value: 'token456', domain: 'api.example.com' },
    ])

    const wrapper = mount(CookiesTable, {
      props: {
        cookies,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * Delete buttons should only appear for existing cookies.
     * Clicking the delete button on the second cookie (index 1)
     * should emit a delete event with that index.
     */
    const deleteButtons = wrapper.findAll('button')
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2)

    await deleteButtons.at(1)!.trigger('click')

    expect(mockEventBus.emit).toHaveBeenCalledWith('cookie:delete:cookie', {
      cookieName: 'authToken',
      index: 1,
      collectionType: 'document',
    })
  })

  it('does not add a new cookie when name is empty in the last row', async () => {
    const cookies = createMockCookies([{ name: 'sessionId', value: 'abc123', domain: 'example.com' }])

    const wrapper = mount(CookiesTable, {
      props: {
        cookies,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * When updating only the value (not the name) in the empty row,
     * no event should be emitted because we require a name to create
     * a new cookie. CodeInput index 4 is the value input for the empty row.
     */
    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    const emptyRowValueInput = codeInputs.at(4)!
    await emptyRowValueInput.vm.$emit('update:modelValue', 'some-value')

    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })

  it('always displays an empty row at the end for adding new cookies', () => {
    const cookiesWithData = createMockCookies([
      { name: 'sessionId', value: 'abc123', domain: 'example.com' },
      { name: 'authToken', value: 'token456', domain: 'api.example.com' },
    ])

    const wrapperWithCookies = mount(CookiesTable, {
      props: {
        cookies: cookiesWithData,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * With 2 existing cookies, there should be 9 CodeInput components:
     * 2 cookies × 3 inputs (name + value + domain) + 1 empty row × 3 inputs.
     */
    const codeInputsWithCookies = wrapperWithCookies.findAllComponents({ name: 'CodeInput' })
    expect(codeInputsWithCookies).toHaveLength(9)

    const emptyCookies = createMockCookies([])

    const wrapperEmpty = mount(CookiesTable, {
      props: {
        cookies: emptyCookies,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * With no existing cookies, there should still be 3 CodeInput components
     * for the empty row (name + value + domain).
     */
    const codeInputsEmpty = wrapperEmpty.findAllComponents({ name: 'CodeInput' })
    expect(codeInputsEmpty).toHaveLength(3)
  })

  it('emits event when toggling checkbox to disable a cookie', async () => {
    const cookies = createMockCookies([
      { name: 'sessionId', value: 'abc123', domain: 'example.com', isDisabled: false },
    ])

    const wrapper = mount(CookiesTable, {
      props: {
        cookies,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * When unchecking the checkbox (disabling the cookie),
     * it should emit an update event with isDisabled: true.
     */
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    const firstCheckbox = checkboxes.at(0)!
    await firstCheckbox.setValue(false)

    expect(mockEventBus.emit).toHaveBeenCalledWith('cookie:upsert:cookie', {
      payload: {
        name: 'sessionId',
        value: 'abc123',
        domain: 'example.com',
        isDisabled: true,
      },
      index: 0,
      collectionType: 'document',
    })
  })

  it('emits event when updating domain field', async () => {
    const cookies = createMockCookies([{ name: 'sessionId', value: 'abc123', domain: 'example.com' }])

    const wrapper = mount(CookiesTable, {
      props: {
        cookies,
        eventBus: mockEventBus,
        collectionType: 'document',
      },
    })

    /**
     * When changing the domain of the first cookie,
     * it should emit an update event with the new domain.
     * CodeInput index 2 is the domain input for the first cookie row.
     */
    const codeInputs = wrapper.findAllComponents({ name: 'CodeInput' })
    const firstDomainInput = codeInputs.at(2)!
    await firstDomainInput.vm.$emit('update:modelValue', 'newdomain.com')

    expect(mockEventBus.emit).toHaveBeenCalledWith('cookie:upsert:cookie', {
      payload: {
        name: 'sessionId',
        value: 'abc123',
        domain: 'newdomain.com',
        isDisabled: false,
      },
      index: 0,
      collectionType: 'document',
    })
  })
})
