import type { Plugin } from '@scalar/types/snippetz'

import { prepareBrowserRequest } from '@/libs/browser-request'
import { Raw } from '@/libs/javascript'

/** Generates a jQuery Ajax request with explicit body serialization. */
export const jsJquery: Plugin = {
  target: 'js',
  client: 'jquery',
  title: 'jQuery',
  generate(request, configuration) {
    const { url, method, headers, setup, body, withCredentials } = prepareBrowserRequest(request, configuration)
    return [
      ...setup,
      '$.ajax({',
      `  url: ${JSON.stringify(url)},`,
      `  method: ${JSON.stringify(method)},`,
      ...(withCredentials ? ['  xhrFields: { withCredentials: true },'] : []),
      '  processData: false,',
      '  contentType: false,',
      ...(headers.length
        ? [
            '  beforeSend(xhr) {',
            ...headers.map(
              ({ name, value }) =>
                `    xhr.setRequestHeader(${JSON.stringify(name)}, ${value instanceof Raw ? value.value : JSON.stringify(value)});`,
            ),
            '  },',
          ]
        : []),
      `  data: ${body}`,
      '}).done((response) => console.log(response));',
    ].join('\n')
  },
}
