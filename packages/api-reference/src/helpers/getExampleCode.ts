import {
  type ClientId,
  type Request,
  type TargetId,
  snippetz,
} from '@scalar/snippetz'

/**
 * Returns a code example for given HAR request
 */
export async function getExampleCode<T extends TargetId>(
  request: Partial<Request>,
  target: TargetId | string,
  client: ClientId<T> | string,
) {
  // Prevent snippet generation if starting by a variable
  if (request.url?.startsWith('__')) {
    return request.url
  }

  // Generate the code example
  if (snippetz().hasPlugin(target, client)) {
    return snippetz().print(
      target as TargetId,
      client as ClientId<typeof target>,
      request,
    )
  }

  return ''
}
