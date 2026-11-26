import { readFileSync } from 'node:fs'
import { Script } from 'node:vm'

import { JSDOM } from 'jsdom'
import { describe, expect, it, vi } from 'vitest'

const script = new Script(readFileSync(new URL('./enterprise-contact-form.js', import.meta.url), 'utf8'))
const formMarkup = `
  <form class="enterprise-demo-form">
    <input type="checkbox" name="howCanWeHelp" value="API documentation">
    <input type="checkbox" name="howCanWeHelp" value="API client">
  </form>
`

describe('enterprise-contact-form', () => {
  it.each([true, false])('handles revisits and replacement forms (initial form: %s)', async (hasInitialForm) => {
    const dom = new JSDOM(hasInitialForm ? formMarkup : '', { runScripts: 'outside-only' })
    const { window } = dom
    const { document } = window
    const observe = vi.spyOn(window.MutationObserver.prototype, 'observe')
    const documentListener = vi.spyOn(document, 'addEventListener')

    try {
      // Classic scripts share a lexical scope across route visits. Module imports and eval do not reproduce this.
      const context = dom.getInternalVMContext()
      script.runInContext(context)
      script.runInContext(context)
      script.runInContext(context)

      expect(observe.mock.calls.length).toBe(1)
      expect(documentListener.mock.calls.map(([name]) => name)).toStrictEqual(['submit', 'click'])

      // Hydration or a later route visit replaces the form, but the original observer must keep binding it.
      document.body.innerHTML = formMarkup
      const form = document.querySelector('form')!
      const addListener = vi.spyOn(form, 'addEventListener')
      await vi.waitFor(() => expect(form.dataset.loopsBoundDirect).toBe('true'))

      const checkboxes = [...form.querySelectorAll('input')]
      expect(checkboxes.map((checkbox) => checkbox.required)).toStrictEqual([true, true])
      checkboxes[0]!.checked = true
      checkboxes[0]!.dispatchEvent(new window.Event('change', { bubbles: true }))
      expect(checkboxes.map((checkbox) => checkbox.required)).toStrictEqual([false, false])

      // Further mutations and script executions must not add another set of handlers.
      document.body.append(document.createElement('div'))
      script.runInContext(context)
      await new Promise<void>((resolve) => window.queueMicrotask(resolve))
      expect(addListener.mock.calls.map(([name]) => name)).toStrictEqual(['submit', 'change'])
      expect(observe.mock.calls.length).toBe(1)
    } finally {
      window.close()
      vi.restoreAllMocks()
    }
  })
})
