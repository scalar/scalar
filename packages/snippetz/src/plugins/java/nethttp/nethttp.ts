import type { Plugin } from '@scalar/types/snippetz'

import { javaBody, quoteJava } from '@/libs/java'
import { multipartFileBoundary, prepareRequest } from '@/libs/prepare-request'

/** Generates a request using the JDK HTTP client. */
export const javaNethttp: Plugin = {
  target: 'java',
  client: 'nethttp',
  title: 'java.net.http',
  generate(request, configuration) {
    const prepared = prepareRequest(request, configuration)
    const { url, method, headers, body } = prepared
    const boundary = multipartFileBoundary(prepared)
    return [
      ...javaBody(body, boundary),
      'HttpClient client = HttpClient.newHttpClient();',
      'HttpRequest request = HttpRequest.newBuilder()',
      `  .uri(java.net.URI.create(${quoteJava(url)}))`,
      ...headers.map(
        ({ name, value }) =>
          `  .header(${quoteJava(name)}, ${boundary && name.toLowerCase() === 'content-type' ? `${quoteJava(value)}.replace(${quoteJava(boundary)}, boundary)` : quoteJava(value)})`,
      ),
      `  .method(${quoteJava(method)}, HttpRequest.BodyPublishers.${body ? 'ofByteArray(body.toByteArray())' : 'noBody()'})`,
      '  .build();',
      '',
      'HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());',
      'System.out.println(response.body());',
    ].join('\n')
  },
}
