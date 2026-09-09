import { describe, expect, it } from 'vitest'

import { prepareBrowserRequest } from './browser-request'

describe('browser-request', () => {
  it('uses the browser cookie store and enables credentialed requests', () => {
    const prepared = prepareBrowserRequest({ cookies: [{ name: 'a;b', value: 'c d' }] })
    expect(prepared.headers).toStrictEqual([])
    expect(prepared.withCredentials).toBe(true)
    expect(prepared.setup).toStrictEqual([
      '// Run on the request origin to set these cookies in the browser.',
      'document.cookie = "a%3Bb=c%20d; path=/";',
    ])
  })

  it('serializes duplicate form fields with native URLSearchParams', () => {
    const prepared = prepareBrowserRequest({
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [{ name: 'a&b', value: 'x+y z' }, { name: 'a&b', value: '' }, { name: 'empty' }],
      },
    })
    const body: unknown = new Function(`${prepared.setup.join('\n')}\nreturn ${prepared.body};`)()
    expect(body).toBe('a%26b=x%2By+z&a%26b=&empty=')
  })

  it('serializes multipart values and media types with native FormData', async () => {
    const prepared = prepareBrowserRequest({
      headers: [{ name: 'CONTENT-TYPE', value: 'multipart/form-data' }],
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          { name: 'field', value: 'one' },
          { name: 'field', value: 'two' },
          { name: 'props', value: '{"hello":"world"}', contentType: 'application/vnd.api+json' },
          { name: 'file', value: 'file contents', fileName: 'test.txt', contentType: 'text/plain' },
        ],
      },
    })
    const body: FormData = new Function(`${prepared.setup.join('\n')}\nreturn ${prepared.body};`)()
    const parsed = await new Response(body).formData()
    expect(prepared.headers).toStrictEqual([])
    expect(parsed.getAll('field')).toStrictEqual(['one', 'two'])
    const props = parsed.get('props')
    const file = parsed.get('file')
    expect(props instanceof File).toBe(true)
    expect(file instanceof File).toBe(true)
    if (!(props instanceof File) || !(file instanceof File)) {
      throw new Error('Expected typed multipart parts')
    }
    expect(props.type).toBe('application/vnd.api+json')
    expect(await props.text()).toBe('{"hello":"world"}')
    expect(file.name).toBe('test.txt')
    expect(file.type).toBe('text/plain')
    expect(await file.text()).toBe('file contents')
  })

  it('reads selected files when HAR supplies a filename without contents', () => {
    const prepared = prepareBrowserRequest({
      postData: { mimeType: 'multipart/form-data', params: [{ name: 'file', fileName: 'test.txt' }] },
    })
    expect(prepared.setup).toStrictEqual([
      'const body = new FormData();',
      '// Select upload files with an <input type="file" multiple> element first.',
      `const files = document.querySelector('input[type="file"]').files;`,
      'body.append("file", new File([files[0]], "test.txt", { type: "application/octet-stream" }));',
    ])
  })
})
