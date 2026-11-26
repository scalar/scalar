import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import RequestBodyMultipart from './RequestBodyMultipart.vue'

const upload = new File(['file bytes'], 'attachment.txt', { type: 'text/plain' })
vi.mock('@/hooks/use-file-dialog', () => ({
  useFileDialog: (options: { onChange: (files: File[]) => void }) => ({ open: () => options.onChange([upload]) }),
}))

describe('RequestBodyMultipart', () => {
  it('uploads and removes only a binary part while preserving JSON and text parts', async () => {
    const wrapper = mount(RequestBodyMultipart, {
      props: {
        value: [{ id: 1 }, 'description', ''],
        media: {
          schema: {
            type: 'array',
            prefixItems: [{ type: 'object' }, { type: 'string' }, { type: 'string', format: 'binary' }],
          },
        },
      },
    })
    expect(wrapper.emitted('update:value')).toBeUndefined()
    expect(wrapper.findAll('button[aria-label^="Select File"]').length).toBe(1)
    await wrapper.get('button[aria-label="Select File Part 3"]').trigger('click')
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([[{ id: 1 }, 'description', upload]])
    expect(wrapper.text()).toContain('attachment.txt')
    await wrapper.get('button[aria-label="Delete Part 3"]').trigger('click')
    expect(wrapper.emitted('update:value')?.[1]).toStrictEqual([[{ id: 1 }, 'description', '']])
    wrapper.unmount()
  })

  it('keeps invalid JSON drafts local and emits valid structured edits', async () => {
    const wrapper = mount(RequestBodyMultipart, {
      props: { value: [{ id: 1 }], media: { schema: { type: 'array', items: { type: 'object' } } } },
    })
    await wrapper.get('textarea').setValue('{')
    expect(wrapper.get('[role="alert"]').text()).toBe('Enter valid JSON for this part.')
    expect(wrapper.emitted('update:value')).toBeUndefined()
    await wrapper.get('textarea').setValue('{"id":2}')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([[{ id: 2 }]])
    wrapper.unmount()
  })

  it('uploads into an empty named file array', async () => {
    const wrapper = mount(RequestBodyMultipart, {
      props: {
        value: { files: [] },
        media: { schema: { type: 'object', properties: { files: { type: 'array', items: { __scalar_: '' } } } } },
      },
    })
    await wrapper.get('button[aria-label="Select File files / 1"]').trigger('click')
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual([{ files: [upload] }])
    wrapper.unmount()
  })

  it('adds an uploadable part to an empty array and respects maxItems', async () => {
    const wrapper = mount(RequestBodyMultipart, {
      props: {
        value: [],
        media: { schema: { type: 'array', maxItems: 1, items: { type: 'string', format: 'binary' } } },
      },
    })
    await wrapper.get('button').trigger('click')
    expect(wrapper.findAll('textarea').length).toBe(1)
    expect(wrapper.find('button[aria-label="Select File Part 1"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Add part')
    wrapper.unmount()
  })
})
