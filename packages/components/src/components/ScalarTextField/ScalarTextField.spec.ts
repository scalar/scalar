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

    expect(wrapper.html()).toBe(
      `<div data-v-ee644a83="" class="scalar-input-container relative" id="testId">
  <div data-v-ee644a83="" class="scalar-input-wrapper relative flex items-center rounded border border-border"><label data-v-ee644a83="" class="scalar-input-label pointer-events-none absolute left-0 top-0 mx-2 my-3 px-1 text-xs shadow-label peer z-10 origin-top-left rounded bg-back-1 text-fore-3 transition-transform" for="testId">This is a label</label><input data-v-ee644a83="" id="testId" class="scalar-input z-10 w-full resize-none appearance-none border-0 bg-transparent p-3 text-sm text-fore-1 outline-none transition-opacity peer-[]:opacity-0" placeholder="This is a placeholder">
    <div data-v-ee644a83="" class="icon-slot !empty:flex !empty:items-center !empty:pr-3 !empty:w-7 cursor-pointer text-ghost hover:text-fore-1"></div>
  </div><span data-v-ee644a83="" class="helper-text before:font-black before:rounded-full mt-1.5 flex items-center text-xs text-error before:mr-1.5 before:block before:h-4 before:w-4 before:text-center before:leading-4 before:bg-error before:text-white before:content-['!'] empty:hidden"></span>
</div>`,
    )
  })
})
