import { type VueWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import RequestTableTooltip from './RequestTableTooltip.vue'

enableAutoUnmount(afterEach)

const mountTooltip = (
  props: InstanceType<typeof RequestTableTooltip>['$props'],
): VueWrapper<InstanceType<typeof RequestTableTooltip>> =>
  mount(RequestTableTooltip, { props, attachTo: document.body })

const openTooltip = async (wrapper: ReturnType<typeof mountTooltip>): Promise<string> => {
  await wrapper.get('button').trigger('click')
  await flushPromises()
  return document.querySelector('[data-testid="request-table-tooltip-content"]')?.textContent?.trim() ?? ''
}

describe('RequestTableTooltip', () => {
  it.each([
    { value: '' },
    { value: null },
    { value: '', schema: { __scalar_: '' } },
    { value: '', schema: { __scalar_: '', format: undefined, default: undefined } },
    { value: '', schema: { __scalar_: '' }, description: ' \n\t ' },
    { value: '', schema: { __scalar_: '', format: ' ' } },
    { value: new File(['content'], 'upload.bin'), schema: { __scalar_: '' } },
  ])('hides the trigger when there is no displayed content: %j', (props) => {
    const wrapper = mountTooltip(props)

    expect(wrapper.find('button').exists()).toBe(false)
    expect(document.querySelector('[data-testid="request-table-tooltip-content"]')).toBeNull()
  })

  it.each(['array', 'string'] as const)('displays the %s schema', async (type) => {
    const wrapper = mountTooltip({ value: '', schema: { type } })

    expect(wrapper.get('button').attributes('aria-label')).toBe('More Information')
    expect(await openTooltip(wrapper)).toBe(type)
  })

  it('preserves binary schema details for file values', async () => {
    const wrapper = mountTooltip({
      value: new File(['content'], 'upload.bin'),
      schema: { type: 'string', format: 'binary' },
    })

    expect(await openTooltip(wrapper)).toContain('binary')
    expect(document.querySelector('[data-testid="request-table-tooltip-content"]')?.textContent).toContain('string')
  })

  it.each([
    { type: ['string', 'null'], expected: 'string | null' },
    { type: ['string', 'number', 'boolean'], expected: 'string | number | boolean' },
    { type: ['string'], expected: 'string' },
  ] as const)('displays type arrays as readable alternatives: $expected', async ({ type, expected }) => {
    const wrapper = mountTooltip({ value: '', schema: { type: [...type] } })

    expect(await openTooltip(wrapper)).toBe(expected)
  })

  it('preserves all supported schema details and zero bounds', async () => {
    const wrapper = mountTooltip({
      value: '0',
      schema: { type: 'number', format: 'int32', minimum: 0, maximum: 0, default: 0 },
    })

    const content = await openTooltip(wrapper)
    for (const detail of ['number', 'int32', 'min: 0', 'max: 0', 'default: 0']) {
      expect(content).toContain(detail)
    }
  })

  it.each([
    { value: false, expected: 'default: false' },
    { value: '', expected: 'default:' },
    { value: null, expected: 'default:' },
    { value: { nested: 'value' }, expected: 'default: {\n  "nested": "value"\n}' },
  ])('keeps a default-only tooltip for $value', async ({ value, expected }) => {
    const wrapper = mountTooltip({ value: '', schema: { __scalar_: '', default: value } })

    expect(await openTooltip(wrapper)).toBe(expected)
  })

  it('preserves descriptions without schema details', async () => {
    const wrapper = mountTooltip({ value: null, description: 'This value is **read-only**.' })

    expect(await openTooltip(wrapper)).toBe('This value is read-only.')
    expect(document.querySelector('[data-testid="request-table-tooltip-content"] strong')?.textContent).toBe(
      'read-only',
    )
  })

  it('displays the description alongside schema details', async () => {
    const wrapper = mountTooltip({ value: 'hello', schema: { type: 'string' }, description: 'A friendly greeting.' })

    const content = await openTooltip(wrapper)
    expect(content).toContain('string')
    expect(content).toContain('A friendly greeting.')
  })

  it('preserves validation messages in place of schema details and descriptions', async () => {
    const wrapper = mountTooltip({
      value: 'invalid',
      schema: { type: 'number' },
      description: 'A number',
    })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Input is invalid')
    expect(wrapper.get('button').attributes('role')).toBe('alert')
    expect(await openTooltip(wrapper)).toBe('Value must be a number (e.g., 42.5)')
  })

  it('updates trigger visibility when the content changes', async () => {
    const wrapper = mountTooltip({ value: '', schema: { __scalar_: '' } })
    expect(wrapper.find('button').exists()).toBe(false)

    await wrapper.setProps({ description: 'Upload a file.' })
    expect(await openTooltip(wrapper)).toBe('Upload a file.')

    await wrapper.setProps({ description: undefined, schema: { type: 'string' } })
    expect(wrapper.find('button').exists()).toBe(true)

    await wrapper.setProps({ schema: { __scalar_: '' } })
    await flushPromises()
    expect(wrapper.find('button').exists()).toBe(false)
    expect(document.querySelector('[data-testid="request-table-tooltip-content"]')).toBeNull()
  })
})
