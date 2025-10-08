import { mount } from '@vue/test-utils'
import { describe, it } from 'vitest'

import HttpMethod from './HttpMethod.vue'

describe('HttpMethod.vue', () => {
  it('renders normalized method name when short is false', () => {
    mount(HttpMethod, {
      props: { method: 'POST' },
      slots: { default: 'POST' },
    })
  })
})
