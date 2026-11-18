import { htmlFromMarkdown } from '@scalar/markdown'
import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import { describe, expect, it } from 'vitest'

import { type SdkCodeBlock, resolveSdkMarkdown } from './resolve-sdk-markdown'

const schemes: SecuritySchemeObjectSecret[] = [
  {
    type: 'http',
    scheme: 'basic',
    'x-scalar-secret-token': '',
    'x-scalar-secret-username': '<script>alert(1)</script> **public**',
    'x-scalar-secret-password': 'x',
    'x-scalar-credential-placeholders': {
      account: { field: 'username', mask: false },
      password: { field: 'password' },
    },
  },
]

const render = (source: string, securitySchemes = schemes): { html: string; text: string; blocks: SdkCodeBlock[] } => {
  const result: { blocks: SdkCodeBlock[] } = { blocks: [] }
  const html = htmlFromMarkdown(source, {
    transformType: 'root',
    transform: (root) => {
      result.blocks = resolveSdkMarkdown(root, securitySchemes, 'test')
      return root
    },
  })
  return { html, text: textFromHtml(html), blocks: result.blocks }
}

/**
 * The text a browser would show for the HTML.
 *
 * Highlighting wraps tokens such as the `{{` and `}}` of a placeholder in separate
 * spans, so assertions about code-block content read the rendered text instead. A
 * template element parses the markup without running or loading anything in it.
 */
const textFromHtml = (html: string): string => {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content.textContent ?? ''
}

describe('resolve-sdk-markdown', () => {
  it('renders credentials as literal text after Markdown parsing', () => {
    const { html } = render('Account: {{account}}. Password: `{{password}}`.')
    expect(html.includes('<script>')).toBe(false)
    expect(html.includes('alert(1)')).toBe(true)
    expect(html.includes('**public**')).toBe(true)
    expect(html.includes('<strong>public</strong>')).toBe(false)
    expect(html.includes('<code>••••••••</code>')).toBe(true)
  })

  it('keeps raw HTML and URL placeholders unchanged', () => {
    const source =
      '[Account](https://example.com/{{account}})\n\n<a href="https://example.com/{{account}}">{{password}}</a>'
    const { html } = render(source)
    expect(html).toBe(htmlFromMarkdown(source))
    expect(html.includes('{{password}}')).toBe(true)
    expect(html.includes('alert(1)')).toBe(false)
  })

  it('provides masked code and the exact real copy content separately', () => {
    const { html, blocks } = render('```sh\nconfigure --password "{{password}}"\n```')
    expect(blocks).toStrictEqual([
      {
        marker: 'test-0',
        language: 'sh',
        displayContent: 'configure --password "••••••••"',
        copyContent: 'configure --password "x"',
      },
    ])
    expect(html.includes('test-0')).toBe(true)
    expect(html.includes('••••••••')).toBe(true)
  })

  it('keeps public credential Markdown and fences inside the original code block', () => {
    const value = '```\n[unexpected](https://evil.test)\n<script>bad</script>'
    const publicScheme: SecuritySchemeObjectSecret = {
      type: 'apiKey',
      in: 'header',
      name: 'X-ID',
      'x-scalar-secret-token': value,
      'x-scalar-credential-placeholders': { id: { field: 'token', mask: false } },
    }
    const { html, blocks } = render('```sh\nconfigure {{id}}\n```', [publicScheme])
    expect(blocks[0]?.copyContent).toBe(`configure ${value}`)
    expect(blocks[0]?.displayContent).toBe(`configure ${value}`)
    expect(html.match(/<pre>/g)?.length).toBe(1)
    expect(html.includes('href="https://evil.test"')).toBe(false)
    expect(html.includes('<script>')).toBe(false)
  })

  it('masks private values before HTML escaping and syntax highlighting', () => {
    const token = '<secret>&"quoted"'
    const privateScheme: SecuritySchemeObjectSecret = {
      type: 'apiKey',
      in: 'header',
      name: 'X-Key',
      'x-scalar-secret-token': token,
      'x-scalar-credential-placeholders': { token: { field: 'token' } },
    }
    const { html, blocks } = render('```sh\nconfigure {{token}}\n```', [privateScheme])
    expect(blocks[0]?.copyContent).toBe(`configure ${token}`)
    expect(blocks[0]?.displayContent).toBe('configure ••••••••')
    expect(html.includes('secret')).toBe(false)
    expect(html.includes('quoted')).toBe(false)
  })

  it('keeps duplicate names unresolved when another selected scheme has no token', () => {
    const pendingOAuth: SecuritySchemeObjectSecret = {
      type: 'oauth2',
      flows: {},
      'x-scalar-credential-placeholders': { password: { field: 'token' } },
    }
    const { text, blocks } = render('```sh\nconfigure {{password}}\n```', [...schemes, pendingOAuth])
    expect(blocks).toStrictEqual([
      {
        marker: 'test-0',
        language: 'sh',
        displayContent: 'configure {{password}}',
        copyContent: 'configure {{password}}',
      },
    ])
    expect(text.includes('{{password}}')).toBe(true)
  })

  it('masks credentials equal to their placeholder while preserving the copy value', () => {
    const { text, blocks } = render('```sh\nconfigure {{token}}\n```', [
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-Key',
        'x-scalar-secret-token': '{{token}}',
        'x-scalar-credential-placeholders': { token: { field: 'token' } },
      },
    ])
    expect(blocks).toStrictEqual([
      {
        marker: 'test-0',
        language: 'sh',
        displayContent: 'configure ••••••••',
        copyContent: 'configure {{token}}',
      },
    ])
    expect(text.includes('{{token}}')).toBe(false)
    expect(text.includes('configure ••••••••')).toBe(true)
  })

  it('preserves ordinary code and unresolved placeholders for display and copy', () => {
    const { html, blocks } = render('Plain {{account}}\n\n    echo {{missing}}', [])
    expect(blocks).toStrictEqual([
      { marker: 'test-0', language: 'plaintext', displayContent: 'echo {{missing}}', copyContent: 'echo {{missing}}' },
    ])
    expect(html).toContain('Plain {{account}}')
    expect(html).toContain('{{missing}}')
  })
})
