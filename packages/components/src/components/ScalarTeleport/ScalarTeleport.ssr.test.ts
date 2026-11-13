import { consoleErrorSpy, consoleWarnSpy } from '@scalar/helpers/testing/console-spies'
import { afterEach, describe, expect, it } from 'vitest'
import { type Component, createApp, createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'

import ScalarTeleport from './ScalarTeleport.vue'
import ScalarTeleportRoot from './ScalarTeleportRoot.vue'

/** A small app with two teleports, like two menus on the same page */
const App = {
  render: () =>
    h('main', [
      h(ScalarTeleport, null, { default: () => h('div', { id: 'first' }, 'First') }),
      h(ScalarTeleport, null, { default: () => h('div', { id: 'second' }, 'Second') }),
    ]),
}

/** A host page with content of its own around the server-rendered markup */
const renderHostPage = (html: string) => {
  document.body.innerHTML = `<a id="skip-link">Skip</a><header id="header">Header</header><div id="app">${html}</div><footer id="footer">Footer</footer>`

  return ['skip-link', 'header', 'app', 'footer'].map((id) => document.getElementById(id))
}

/** Renders a component the way the server does */
const renderOnServer = (component: Component) => renderToString(createSSRApp(component))

/**
 * Puts server-rendered markup on a host page and hydrates it.
 *
 * This is synchronous on purpose: the content moves in the next tick, and the tests look at the page before that.
 */
const hydrate = (component: Component, html: string) => {
  const hostElements = renderHostPage(html)
  const app = createSSRApp(component)
  app.mount('#app')

  return { app, hostElements }
}

describe('ScalarTeleport.ssr', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  /**
   * Vue returns teleported content separately from the markup and expects the host to place it in the target. Hosts
   * that embed our markup do not get that content, so it has to be part of the markup itself.
   */
  it('renders the content in place on the server', async () => {
    const context: { teleports?: Record<string, string> } = {}
    const html = await renderToString(createSSRApp(App), context)

    expect(html).toContain('<div id="first">First</div>')
    expect(html).toContain('<div id="second">Second</div>')

    // There is nothing left for the host to place in the target
    expect(context.teleports?.body).not.toContain('First')
    expect(context.teleports?.body).not.toContain('Second')
  })

  /**
   * Without the content in the target, Vue hydrates a teleport against the second child of the target. For `body`
   * that is an element of the host page, which would be replaced or emptied.
   */
  it('keeps the host page intact while hydrating', async () => {
    const hostElements = renderHostPage(await renderToString(createSSRApp(App)))
    const first = document.getElementById('first')
    const second = document.getElementById('second')

    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()

    const app = createSSRApp(App)
    app.mount('#app')

    try {
      expect(hostElements.map((element) => element?.isConnected)).toStrictEqual([true, true, true, true])
      expect(document.getElementById('header')?.textContent).toBe('Header')

      // The server-rendered content is reused where it was rendered
      expect(document.querySelector('#app #first')).toBe(first)
      expect(document.querySelector('#app #second')).toBe(second)

      await nextTick()

      expect(hostElements.map((element) => element?.isConnected)).toStrictEqual([true, true, true, true])
      expect(document.getElementById('header')?.textContent).toBe('Header')

      // The markup matched, so Vue had nothing to complain about
      const hydrationMessages = [...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls]
        .flat()
        .map(String)
        .filter((message) => /hydration/i.test(message))
      expect(hydrationMessages).toStrictEqual([])
    } finally {
      app.unmount()
    }
  })

  it('teleports the content once it is mounted', async () => {
    renderHostPage(await renderToString(createSSRApp(App)))
    const first = document.getElementById('first')
    const second = document.getElementById('second')

    const app = createSSRApp(App)
    app.mount('#app')

    try {
      await nextTick()

      // Both moved out of the app, and neither was recreated
      expect(document.querySelector('#app #first')).toBeNull()
      expect(document.querySelector('#app #second')).toBeNull()
      expect(document.getElementById('first')).toBe(first)
      expect(document.getElementById('second')).toBe(second)

      // They do not share a container, so one menu cannot overwrite the other
      expect(first?.parentElement).not.toBe(second?.parentElement)
    } finally {
      app.unmount()
    }
  })

  it('teleports to the nearest ScalarTeleportRoot once it is mounted', async () => {
    const component = {
      render: () =>
        h(ScalarTeleportRoot, null, {
          default: () =>
            h('div', { class: 'container' }, [
              h(ScalarTeleport, null, { default: () => h('div', { id: 'teleported' }, 'Teleported') }),
            ]),
        }),
    }
    const { app } = hydrate(component, await renderOnServer(component))

    try {
      expect(document.querySelector('.container #teleported')).not.toBeNull()

      await nextTick()

      expect(document.querySelector('.container #teleported')).toBeNull()
      expect(document.querySelector('#app .scalar-teleport-root #teleported')).not.toBeNull()
    } finally {
      app.unmount()
    }
  })

  it('keeps the content in place when teleporting is disabled', async () => {
    const component = {
      render: () =>
        h('main', [h(ScalarTeleport, { disabled: true }, { default: () => h('div', { id: 'teleported' }) })]),
    }
    const { app } = hydrate(component, await renderOnServer(component))

    try {
      await nextTick()

      expect(document.querySelector('#app #teleported')).not.toBeNull()
    } finally {
      app.unmount()
    }
  })

  it.each(['client-only', 'hydrated'])('keeps a bare disabled attribute in place when %s', async (mode) => {
    const component = {
      components: { ScalarTeleport },
      template: '<main><ScalarTeleport disabled><div id="teleported">Content</div></ScalarTeleport></main>',
    }
    renderHostPage(mode === 'hydrated' ? await renderOnServer(component) : '')
    const app = mode === 'hydrated' ? createSSRApp(component) : createApp(component)
    app.mount('#app')

    try {
      await nextTick()

      const content = document.querySelector('#app main #teleported')
      expect(content?.textContent).toBe('Content')
      expect(document.getElementById('teleported')).toBe(content)
    } finally {
      app.unmount()
    }
  })

  /**
   * Vue only looks for the target while hydrating. Without one, moving the content later would throw, so the
   * content has to stay usable where it is.
   */
  it('keeps the content in place when the target is not on the page', async () => {
    const component = {
      render: () =>
        h('main', [h(ScalarTeleport, { to: '#missing' }, { default: () => h('div', { id: 'teleported' }) })]),
    }
    const { app, hostElements } = hydrate(component, await renderOnServer(component))

    try {
      await nextTick()

      expect(document.querySelector('#app #teleported')).not.toBeNull()
      expect(hostElements.map((element) => element?.isConnected)).toStrictEqual([true, true, true, true])
    } finally {
      app.unmount()
    }

    expect(document.getElementById('teleported')).toBeNull()
  })

  it('waits until it is mounted even when it teleports immediately', async () => {
    const component = {
      render: () =>
        h('main', [h(ScalarTeleport, { immediate: true }, { default: () => h('div', { id: 'teleported' }) })]),
    }
    const { app } = hydrate(component, await renderOnServer(component))

    try {
      expect(document.querySelector('#app #teleported')).not.toBeNull()

      await nextTick()

      expect(document.querySelector('#app #teleported')).toBeNull()
      expect(document.getElementById('teleported')).not.toBeNull()
    } finally {
      app.unmount()
    }
  })

  it('removes the content when the app is unmounted', async () => {
    const { app } = hydrate(App, await renderOnServer(App))

    await nextTick()
    app.unmount()

    expect(document.getElementById('first')).toBeNull()
    expect(document.getElementById('second')).toBeNull()
  })

  it('teleports right away without server-rendered markup', async () => {
    document.body.innerHTML = '<div id="app"></div>'

    const app = createApp(App)
    app.mount('#app')

    try {
      // Teleports are deferred by default, so the target is resolved after the first render
      await nextTick()

      expect(document.querySelector('#app #first')).toBeNull()
      expect(document.getElementById('first')).not.toBeNull()
    } finally {
      app.unmount()
    }
  })
})
