import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { createRenderer } from './render-document'
import type { AsyncApiRenderOptions } from './types'

/** Render an upgraded, workspace-resolved document without fetching or loading files. */
export const createMarkdownFromAsyncApi = async (
  document: AsyncApiDocument | Record<string, unknown>,
  options?: AsyncApiRenderOptions,
): Promise<string> => createRenderer(document).render(options)
