import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import ScalarTeleport from './ScalarTeleport.vue'
import ScalarTeleportRoot from './ScalarTeleportRoot.vue'

describe('ScalarTeleport', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="app"></div>`
  })

  it('teleports content to the nearest ScalarTeleportRoot', () => {
    const wrapper = mount(
      {
        components: { ScalarTeleport, ScalarTeleportRoot },
        template: `
        <ScalarTeleportRoot>
          <div class="container">
            <ScalarTeleport>
              <div id="teleported">Teleported</div>
            </ScalarTeleport>
          </div>
        </ScalarTeleportRoot>
      `,
      },
      { attachTo: '#app' },
    )

    // Check that the teleported content exists
    expect(wrapper.find('#teleported').exists()).toBeTruthy()

    // Check that the content isn't in the container
    expect(wrapper.find('.container #teleported').exists()).toBe(false)

    // Check that the content is in the teleport root
    expect(wrapper.find('.scalar-teleport-root #teleported').exists()).toBeTruthy()

    wrapper.unmount()
  })

  it('teleports to a body if no teleport root is found', () => {
    const wrapper = mount({
      components: { ScalarTeleport, ScalarTeleportRoot },
      template: `
        <div class="container">
          <ScalarTeleport>
            <div id="teleported">Teleported</div>
          </ScalarTeleport>
        </div>
      `,
    })

    // Check that content isn't in the container
    expect(wrapper.find('.container #teleported').exists()).toBe(false)

    // Check that content was teleported to body
    expect(document.querySelector('body > #teleported')).toBeDefined()
  })

  it('respects the disabled prop', async () => {
    const wrapper = mount(
      {
        props: ['disabled'],
        components: { ScalarTeleport, ScalarTeleportRoot },
        template: `
        <ScalarTeleportRoot>
          <div class="container">
            <ScalarTeleport :disabled="disabled">
              <div id="teleported">Teleported</div>
            </ScalarTeleport>
          </div>
        </ScalarTeleportRoot>
      `,
      },
      { attachTo: '#app', props: { disabled: true } },
    )

    const container = wrapper.find('.container')
    const root = wrapper.find('.scalar-teleport-root')

    // Content should remain in original location when disabled
    expect(container.find('#teleported').exists()).toBe(true)
    expect(root.find('#teleported').exists()).toBe(false)

    // Content should teleport when disabled is removed
    wrapper.setProps({ disabled: false })

    await wrapper.vm.$nextTick()

    expect(container.find('#teleported').exists()).toBe(false)
    expect(root.find('#teleported').exists()).toBe(true)

    wrapper.unmount()
  })

  it('allows custom teleport root id', () => {
    const wrapper = mount(
      {
        components: { ScalarTeleport, ScalarTeleportRoot },
        template: `
        <ScalarTeleportRoot id="custom-root">
          <div class="container">
            <ScalarTeleport>
              <div id="teleported">Teleported</div>
            </ScalarTeleport>
          </div>
        </ScalarTeleportRoot>
      `,
      },
      { attachTo: '#app' },
    )

    // Should render the teleport root
    expect(wrapper.find('#custom-root').exists()).toBeTruthy()

    // Should render the teleported content in the teleport root
    expect(wrapper.find('#custom-root #teleported').exists()).toBeTruthy()

    wrapper.unmount()
  })

  it('allows custom teleport target', () => {
    // Create a custom target in the document
    const target = document.createElement('div')
    target.id = 'custom-target'
    document.body.appendChild(target)

    mount({
      components: { ScalarTeleport, ScalarTeleportRoot },
      template: `
        <div class="container">
            <ScalarTeleport to="#custom-target">
                <div id="teleported">Custom Target Content</div>
            </ScalarTeleport>
        </div>
      `,
    })

    // Check that content was teleported to custom target
    const customTargetEl = document.querySelector('#custom-target')
    expect(customTargetEl).toBeDefined()
    expect(customTargetEl?.querySelector('#teleported')).toBeDefined()
  })
})
