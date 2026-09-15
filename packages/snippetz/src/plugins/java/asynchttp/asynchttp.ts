import type { Plugin } from '@scalar/types/snippetz'

import { javaBody, quoteJava } from '@/libs/java'
import { prepareRequest } from '@/libs/prepare-request'

/** Generates a request using AsyncHttpClient and closes the client after completion. */
export const javaAsynchttp: Plugin = {
  target: 'java',
  client: 'asynchttp',
  title: 'AsyncHttp',
  generate(request, configuration) {
    const { url, method, headers, body } = prepareRequest(request, configuration)
    return [
      ...javaBody(body),
      'try (AsyncHttpClient client = new DefaultAsyncHttpClient()) {',
      `  Response response = client.prepare(${quoteJava(method)}, ${quoteJava(url)})`,
      ...headers.map(({ name, value }) => `    .addHeader(${quoteJava(name)}, ${quoteJava(value)})`),
      ...(body ? ['    .setBody(body.toByteArray())'] : []),
      '    .execute()',
      '    .get();',
      '  System.out.println(response.getResponseBody());',
      '}',
    ].join('\n')
  },
}
