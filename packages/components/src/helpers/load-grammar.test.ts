import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, watchEffect } from 'vue'

/** Names passed to `loadLanguage`, and per-language overrides that make a download fail or hang */
const state = vi.hoisted(() => ({
  calls: [] as string[],
  overrides: new Map<string, () => Promise<never>>(),
  /** Names `grammarFor` must never find, to simulate the lookup tables drifting apart */
  unfindable: new Set<string>(),
}))

vi.mock('@scalar/highlight/lazy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/highlight/lazy')>()
  return {
    ...actual,
    loadLanguage: (name: string) => {
      state.calls.push(name)
      return state.overrides.get(name)?.() ?? actual.loadLanguage(name)
    },
  }
})

vi.mock('@scalar/highlight/compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/highlight/compat')>()
  return {
    ...actual,
    grammarFor: (name: string) => (state.unfindable.has(name.toLowerCase()) ? undefined : actual.grammarFor(name)),
  }
})

const { ensureGrammar, getRenderedLanguages, preloadGrammars } = await import('./load-grammar')
const { grammarFor } = await import('@scalar/highlight/compat')

/**
 * Grammars stay registered for the life of the module, so every test uses its
 * own languages and first checks that nobody loaded them yet. A test that
 * comes to depend on another one fails here, rather than passing by accident.
 */
const expectNotLoaded = (...names: string[]): void => {
  for (const name of names) {
    expect(grammarFor(name), `${name} was loaded by an earlier test`).toBeUndefined()
  }
}

/**
 * Calls `ensureGrammar` the way a code block's render does, and records each result.
 *
 * The effect calls it directly rather than through a computed, so it re-runs on
 * every counter bump even when the result stays `false`, which is what lets a
 * test see a render that would ask again. A loop that never yields would hang
 * the test run rather than fail it, so the effect gives up after a few renders:
 * skipping `ensureGrammar` drops its dependencies, and it stops re-running.
 */
const renderWithGrammar = (name: string) => {
  const renders: boolean[] = []
  const scope = effectScope()
  scope.run(() =>
    watchEffect(() => {
      if (renders.length < 10) {
        renders.push(ensureGrammar(name))
      }
    }),
  )
  return { renders, stop: () => scope.stop() }
}

describe('load-grammar', () => {
  beforeEach(() => {
    state.calls.length = 0
    state.overrides.clear()
    state.unfindable.clear()
  })

  describe('ensureGrammar', () => {
    it('highlights curl, JSON, JavaScript and TypeScript on the first render, without a download', () => {
      for (const name of ['curl', 'json', 'javascript', 'js', 'typescript', 'ts', 'tsx', 'Node']) {
        expect(ensureGrammar(name), name).toBe(true)
      }

      expect(state.calls).toEqual([])
    })

    it('renders again with the grammar once it has loaded', async () => {
      expectNotLoaded('python')

      const { renders, stop } = renderWithGrammar('python')
      await vi.waitFor(() => expect(renders).toEqual([false, true]))
      stop()

      expect(state.calls).toEqual(['python'])
    })

    it('shares one download between the aliases of a language', async () => {
      expectNotLoaded('yaml')

      expect(ensureGrammar('yml')).toBe(false)
      expect(ensureGrammar('yaml')).toBe(false)
      expect(ensureGrammar('YAML')).toBe(false)
      await vi.waitFor(() => expect(ensureGrammar('yml')).toBe(true))

      expect(state.calls).toEqual(['yaml'])
    })

    it('highlights a capitalised language name', async () => {
      expectNotLoaded('php')

      const { renders, stop } = renderWithGrammar('PHP')
      await vi.waitFor(() => expect(renders).toEqual([false, true]))
      stop()

      expect(state.calls).toEqual(['php'])
    })

    it('stops asking when the grammar is registered but still not found under that name', async () => {
      expectNotLoaded('bash')
      // A name `resolveLanguageName` knows and `grammarFor` does not, as `Node` once was.
      // Every finished load would re-render the block, which would ask again, forever.
      state.unfindable.add('zsh')

      const { renders, stop } = renderWithGrammar('Zsh')
      await vi.waitFor(() => expect(grammarFor('bash')).toBeDefined())
      for (let tick = 0; tick < 20; tick++) {
        await flushPromises()
      }
      stop()

      expect(state.calls).toEqual(['bash'])
      // Once for the first render, and once more when the grammar arrives, then it stops
      expect(renders).toEqual([false, false])
    })

    it('does not load plain text or unknown languages', async () => {
      expect(ensureGrammar('plaintext')).toBe(false)
      expect(ensureGrammar('not-a-language')).toBe(false)
      expect(ensureGrammar('constructor')).toBe(false)
      await flushPromises()

      expect(state.calls).toEqual([])
    })

    it('leaves a block plain when its download fails, and retries on the next render', async () => {
      expectNotLoaded('ruby')
      state.overrides.set('ruby', () => Promise.reject(new Error('Network error')))

      expect(ensureGrammar('ruby')).toBe(false)
      await flushPromises()
      expect(ensureGrammar('ruby')).toBe(false)
      await flushPromises()

      // The failure is forgotten, so the second render asks again
      expect(state.calls).toEqual(['ruby', 'ruby'])

      state.overrides.delete('ruby')
      expect(ensureGrammar('ruby')).toBe(false)
      await vi.waitFor(() => expect(ensureGrammar('ruby')).toBe(true))
    })
  })

  describe('preloadGrammars', () => {
    it('loads each language once, whatever names it is given', async () => {
      expectNotLoaded('kotlin')

      await preloadGrammars(['kt', 'kotlin', 'Kotlin', 'plaintext', 'not-a-language'])

      expect(state.calls).toEqual(['kotlin'])
      expect(grammarFor('kt')).toBeDefined()
    })

    it('waits for every grammar when one of them fails', async () => {
      expectNotLoaded('go', 'rust', 'swift')
      state.overrides.set('go', () => Promise.reject(new Error('Network error')))

      // Settles instead of rejecting, and only after the grammars that do load
      await expect(preloadGrammars(['go', 'rust', 'swift'])).resolves.toBeUndefined()

      expect(grammarFor('go')).toBeUndefined()
      expect(grammarFor('rust')).toBeDefined()
      expect(grammarFor('swift')).toBeDefined()
    })

    it('renders blocks that rendered plain again once their grammars arrive', async () => {
      expectNotLoaded('lua')
      // Hold the block's own download so only the preload can finish it
      state.overrides.set('lua', () => new Promise<never>(() => undefined))

      const { renders, stop } = renderWithGrammar('lua')
      state.overrides.delete('lua')
      await preloadGrammars(['lua'])
      await flushPromises()
      stop()

      expect(renders).toEqual([false, true])
    })
  })

  describe('getRenderedLanguages', () => {
    /** Server-rendered markup, the way `ScalarCodeBlock` and `ScalarMarkdown` leave it */
    const markup = (html: string): HTMLElement => {
      const element = document.createElement('div')
      element.innerHTML = html
      return element
    }

    it('reads each language once, from both language-* and lang-* classes', () => {
      const element = markup(`
        <pre><code class="hljs language-python">a</code></pre>
        <pre><code class="hljs language-python custom-scroll">b</code></pre>
        <pre><code class="hljs lang-ruby">c</code></pre>
        <pre><code class="hljs language-Node">d</code></pre>`)

      expect(getRenderedLanguages(element)).toEqual(['python', 'ruby', 'Node'])
    })

    it('reads the first language class of a block, as the Markdown highlighter does', () => {
      const element = markup('<pre><code class="hljs lang-go language-rust">a</code></pre>')

      expect(getRenderedLanguages(element)).toEqual(['go'])
    })

    it('skips blocks marked no-highlight and code that was never highlighted', () => {
      const element = markup(`
        <pre><code class="hljs no-highlight language-python">a</code></pre>
        <pre><code class="hljs nohighlight language-python">b</code></pre>
        <pre><code class="language-swift">c</code></pre>
        <pre><code class="hljs">d</code></pre>`)

      expect(getRenderedLanguages(element)).toEqual([])
    })
  })
})
