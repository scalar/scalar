import { ScalarCodeBlock } from '@scalar/components/code-block'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ModifyConfiguration from './ModifyConfiguration.vue'

describe('ModifyConfiguration', () => {
  it('overrides supplied schema ordering and keeps the generated JSON in sync', async () => {
    const configuration: Partial<ApiReferenceConfiguration> = { orderSchemaPropertiesBy: 'preserve' }
    const wrapper = mount(ModifyConfiguration, {
      attachTo: document.body,
      props: {
        configuration,
        overrides: { hideModelNames: true },
        'onUpdate:overrides': (overrides) => wrapper.setProps({ overrides }),
      },
    })

    await wrapper.get('button').trigger('click')
    await flushPromises()
    const select = document.querySelector<HTMLSelectElement>('select[aria-label="Schema Property Order"]')!
    expect(select.value).toBe('preserve')

    select.value = 'alpha'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()

    expect(wrapper.props('overrides')).toStrictEqual({ hideModelNames: true, orderSchemaPropertiesBy: 'alpha' })
    expect(wrapper.getComponent(ScalarCodeBlock).props('content')).toBe(
      prettyPrintJson({ hideModelNames: true, orderSchemaPropertiesBy: 'alpha' }),
    )

    select.value = 'preserve'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()
    expect(wrapper.props('overrides')).toStrictEqual({ hideModelNames: true, orderSchemaPropertiesBy: 'preserve' })
    wrapper.unmount()
  })
})
