import { DOCUMENT_ROOT_SYMBOL } from '@scalar/use-hooks/useDocumentRoot'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick, onMounted, ref } from 'vue'

import ScalarTeleport from './ScalarTeleport.vue'
import ScalarTeleportRoot from './ScalarTeleportRoot.vue'

enableAutoUnmount(afterEach)

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
    await wrapper.setProps({ disabled: false })

    await wrapper.vm.$nextTick()

    expect(container.find('#teleported').exists()).toBe(false)
    expect(root.find('#teleported').exists()).toBe(true)
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

  /** A host element with an open shadow root, and a container in it to mount into */
  const createShadowRoot = (): { root: ShadowRoot; container: HTMLElement } => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = host.attachShadow({ mode: 'open' })
    const container = document.createElement('div')
    root.append(container)

    return { root, container }
  }

  const mountInShadowRoot = (component: object, container: HTMLElement, root: ShadowRoot) =>
    mount(component, { attachTo: container, global: { provide: { [DOCUMENT_ROOT_SYMBOL]: root } } })

  it('teleports content to the nearest ScalarTeleportRoot in a shadow root', async () => {
    const { root, container } = createShadowRoot()

    mountInShadowRoot(
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
      container,
      root,
    )

    await nextTick()

    expect(root.querySelector('.container #teleported')).toBeNull()
    expect(root.querySelector('.scalar-teleport-root #teleported')?.textContent).toBe('Teleported')
    expect(document.querySelector('#teleported')).toBeNull()
  })

  it('stays in its own shadow tree when the page has an element with the same id', async () => {
    const outside = document.createElement('div')
    outside.id = 'shared-target'
    document.body.append(outside)
    const { root, container } = createShadowRoot()

    mountInShadowRoot(
      {
        components: { ScalarTeleport, ScalarTeleportRoot },
        template: `
          <ScalarTeleportRoot id="shared-target">
            <ScalarTeleport><button>Local overlay</button></ScalarTeleport>
          </ScalarTeleportRoot>
        `,
      },
      container,
      root,
    )

    await nextTick()

    expect(root.querySelector('#shared-target button')?.textContent).toBe('Local overlay')
    expect(outside.textContent).toBe('')
  })

  it('moves the content instead of mounting it again in a shadow root', async () => {
    const { root, container } = createShadowRoot()
    let mountCount = 0
    const Content = {
      setup: () => onMounted(() => mountCount++),
      template: '<div id="teleported">Teleported</div>',
    }

    mountInShadowRoot(
      {
        components: { Content, ScalarTeleport, ScalarTeleportRoot },
        template: '<ScalarTeleportRoot><ScalarTeleport><Content /></ScalarTeleport></ScalarTeleportRoot>',
      },
      container,
      root,
    )

    await nextTick()

    expect(root.querySelector('.scalar-teleport-root #teleported')).not.toBeNull()
    expect(mountCount).toBe(1)
  })

  it('teleports immediately when it mounts with the root in a shadow root', async () => {
    const { root, container } = createShadowRoot()

    mountInShadowRoot(
      {
        components: { ScalarTeleport, ScalarTeleportRoot },
        template: `
          <ScalarTeleportRoot>
            <ScalarTeleport immediate><div id="teleported">Teleported</div></ScalarTeleport>
          </ScalarTeleportRoot>
        `,
      },
      container,
      root,
    )

    await nextTick()

    expect(root.querySelector('.scalar-teleport-root #teleported')).not.toBeNull()
  })

  it('teleports content that mounts after the root in a shadow root', async () => {
    const { root, container } = createShadowRoot()

    const wrapper = mountInShadowRoot(
      {
        components: { ScalarTeleport, ScalarTeleportRoot },
        setup: () => ({ open: ref(false) }),
        template: `
          <ScalarTeleportRoot>
            <ScalarTeleport v-if="open" immediate><div id="teleported">Teleported</div></ScalarTeleport>
          </ScalarTeleportRoot>
        `,
      },
      container,
      root,
    )

    await nextTick()
    ;(wrapper.vm as unknown as { open: boolean }).open = true
    await nextTick()

    expect(root.querySelector('.scalar-teleport-root #teleported')).not.toBeNull()
  })

  it('keeps disabled content in place until it is enabled in a shadow root', async () => {
    const { root, container } = createShadowRoot()

    const wrapper = mountInShadowRoot(
      {
        components: { ScalarTeleport, ScalarTeleportRoot },
        setup: () => ({ disabled: ref(true) }),
        template: `
          <ScalarTeleportRoot>
            <div class="container">
              <ScalarTeleport :disabled="disabled"><div id="teleported">Teleported</div></ScalarTeleport>
            </div>
          </ScalarTeleportRoot>
        `,
      },
      container,
      root,
    )
    await nextTick()

    expect(root.querySelector('.container #teleported')).not.toBeNull()

    ;(wrapper.vm as unknown as { disabled: boolean }).disabled = false
    await nextTick()

    expect(root.querySelector('.container #teleported')).toBeNull()
    expect(root.querySelector('.scalar-teleport-root #teleported')).not.toBeNull()
  })

  it('falls back to the shadow root without a ScalarTeleportRoot', async () => {
    const { root, container } = createShadowRoot()

    mountInShadowRoot(
      {
        components: { ScalarTeleport },
        template: `
          <div class="container">
            <ScalarTeleport><div id="teleported">Teleported</div></ScalarTeleport>
          </div>
        `,
      },
      container,
      root,
    )

    await nextTick()

    // Moved out of the container into a direct child of the shadow root
    const teleported = root.querySelector('#teleported')
    const topLevel = [...root.children].find((child) => child.contains(teleported))
    expect(teleported).not.toBeNull()
    expect(container.contains(teleported)).toBe(false)
    expect(topLevel).toBeDefined()
    expect(topLevel).not.toBe(container)
    expect(document.querySelector('#teleported')).toBeNull()
  })

  it('teleports to a target that renders in the same update as a new `to` in a shadow root', async () => {
    const { root, container } = createShadowRoot()

    const wrapper = mountInShadowRoot(
      {
        components: { ScalarTeleport, ScalarTeleportRoot },
        setup: () => ({ target: ref<string | undefined>(undefined) }),
        template: `
          <ScalarTeleportRoot>
            <ScalarTeleport :to="target"><div id="teleported">Teleported</div></ScalarTeleport>
            <div v-if="target" id="late" />
          </ScalarTeleportRoot>
        `,
      },
      container,
      root,
    )

    await nextTick()
    ;(wrapper.vm as unknown as { target: string }).target = '#late'
    await nextTick()

    expect(root.querySelector('#late #teleported')).not.toBeNull()
  })

  it('keeps focus on content that teleports immediately in a shadow root', async () => {
    const { root, container } = createShadowRoot()
    const FocusedInput = {
      setup() {
        const input = ref<HTMLInputElement | null>(null)
        onMounted(() => input.value?.focus())
        return { input }
      },
      template: '<input ref="input" />',
    }

    mountInShadowRoot(
      {
        components: { FocusedInput, ScalarTeleport, ScalarTeleportRoot },
        template: `
          <ScalarTeleportRoot>
            <ScalarTeleport immediate><FocusedInput /></ScalarTeleport>
          </ScalarTeleportRoot>
        `,
      },
      container,
      root,
    )

    await nextTick()

    const input = root.querySelector('.scalar-teleport-root input')
    expect(input).not.toBeNull()
    expect(root.activeElement).toBe(input)
  })

  it('removes the content from the shadow root when it is unmounted', async () => {
    const { root, container } = createShadowRoot()

    const wrapper = mountInShadowRoot(
      {
        components: { ScalarTeleport, ScalarTeleportRoot },
        template: '<ScalarTeleportRoot><ScalarTeleport><div id="teleported" /></ScalarTeleport></ScalarTeleportRoot>',
      },
      container,
      root,
    )

    await nextTick()
    wrapper.unmount()

    expect(root.querySelector('#teleported')).toBeNull()
  })
})
