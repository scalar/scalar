import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarTextField from './ScalarTextField.vue'

describe('ScalarIconButton', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarTextField, {
      props: {
        id: 'testId',
        modelValue: '',
        label: 'This is a label',
        placeholder: 'This is a placeholder',
      },
    })

    // Wait for icon to load
    await flushPromises()

    expect(wrapper.html({ raw: true })).toBe(
      `<div data-v-ee644a83="" class="scalar-input-container relative" id="testId"><div data-v-ee644a83="" class="scalar-input-wrapper relative flex items-center rounded border border-solid border-border"><input data-v-ee644a83="" id="testId" class="scalar-input z-10 w-full resize-none appearance-none border-0 bg-transparent p-3 text-sm text-fore-1 outline-none transition-opacity" placeholder="This is a placeholder"><label data-v-ee644a83="" class="scalar-input-label pointer-events-none absolute left-0 top-0 mx-2 my-3 px-1 text-xs shadow-current z-10 origin-top-left rounded text-fore-3 transition-transform" for="testId" style="box-shadow: 0 0 4px 4px var(--theme-background-2, var(--default-theme-background-2));">This is a label</label><div data-v-ee644a83="" class="icon-slot cursor-pointer text-ghost hover:text-fore-1 !empty:flex !empty:w-7 !empty:items-center !empty:pr-3"></div></div><span data-v-ee644a83="" class="helper-text mt-1.5 flex items-center text-xs text-error before:rounded-full before:font-black before:mr-1.5 before:block before:h-4 before:w-4 before:text-center before:leading-4 before:bg-error before:text-white before:content-['!'] empty:hidden"></span></div>`,
    )
  })
})
