import type { Plugin } from '@scalar/types/snippetz'

import { javaBody, quoteJava } from '@/libs/java'
import { multipartFileBoundary, prepareRequest } from '@/libs/prepare-request'

/** Generates a Unirest request including arbitrary methods and byte-preserving bodies. */
export const javaUnirest: Plugin = {
  target: 'java',
  client: 'unirest',
  title: 'Unirest',
  generate(request, configuration) {
    const prepared = prepareRequest(request, configuration)
    const { url, method, headers, body } = prepared
    const boundary = multipartFileBoundary(prepared)
    return [
      ...javaBody(body, boundary),
      `HttpResponse<String> response = Unirest.request(${quoteJava(method)}, ${quoteJava(url)})`,
      ...headers.map(
        ({ name, value }) =>
          `  .header(${quoteJava(name)}, ${boundary && name.toLowerCase() === 'content-type' ? `${quoteJava(value)}.replace(${quoteJava(boundary)}, boundary)` : quoteJava(value)})`,
      ),
      ...(body ? ['  .body(body.toByteArray())'] : []),
      '  .asString();',
      'System.out.println(response.getBody());',
    ].join('\n')
  },
}
