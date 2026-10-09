import type { Plugin } from '@scalar/types/snippetz'

import { javaBody, quoteJava } from '@/libs/java'
import { multipartFileBoundary, prepareRequest } from '@/libs/prepare-request'

/** Generates a request using AsyncHttpClient and closes the client after completion. */
export const javaAsynchttp: Plugin = {
  target: 'java',
  client: 'asynchttp',
  title: 'AsyncHttp',
  generate(request, configuration) {
    const prepared = prepareRequest(request, configuration)
    const { url, method, headers, body } = prepared
    const boundary = multipartFileBoundary(prepared)
    return [
      ...javaBody(body, boundary),
      'try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {',
      `  Response response = client.prepare(${quoteJava(method)}, ${quoteJava(url)})`,
      ...headers.map(
        ({ name, value }) =>
          `    .addHeader(${quoteJava(name)}, ${boundary && name.toLowerCase() === 'content-type' ? `${quoteJava(value)}.replace(${quoteJava(boundary)}, boundary)` : quoteJava(value)})`,
      ),
      ...(body ? ['    .setBody(body.toByteArray())'] : []),
      '    .execute()',
      '    .get();',
      '  System.out.println(response.getResponseBody());',
      '}',
    ].join('\n')
  },
}
