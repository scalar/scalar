import type { Plugin } from '@scalar/types/snippetz'

import { prepareBrowserRequest } from '@/libs/browser-request'

/** Generates a request using the browser XMLHttpRequest API. */
export const jsXhr: Plugin = {
  target: 'js',
  client: 'xhr',
  title: 'XHR',
  generate(request, configuration) {
    const { url, method, headers, setup, body } = prepareBrowserRequest(request, configuration)
    return [
      ...setup,
      'const xhr = new XMLHttpRequest();',
      `xhr.open(${JSON.stringify(method)}, ${JSON.stringify(url)});`,
      'xhr.withCredentials = true;',
      ...headers.map(({ name, value }) => `xhr.setRequestHeader(${JSON.stringify(name)}, ${JSON.stringify(value)});`),
      'xhr.addEventListener("load", () => console.log(xhr.responseText));',
      `xhr.send(${body});`,
    ].join('\n')
  },
}
