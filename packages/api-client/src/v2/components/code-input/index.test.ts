import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { CodeInput } from './index'

describe('index', () => {
  it('supports HTML mode and exposes editor methods through the public CodeInput', async () => {
    const wrapper = mount(CodeInput, {
      attachTo: document.body,
      props: { modelValue: '<strong>Hello</strong>', language: 'html', environment: undefined },
    })
    try {
      await nextTick()
      expect(wrapper.vm.codeMirror?.state.doc.toString()).toBe('<strong>Hello</strong>')
      expect(
        wrapper
          .get('.cm-line')
          .findAll('span')
          .map((span) => span.text()),
      ).toContain('strong')

      wrapper.vm.focus('end')
      expect(wrapper.vm.cursorPosition()).toBe('<strong>Hello</strong>'.length)
    } finally {
      wrapper.unmount()
    }
  })
})
