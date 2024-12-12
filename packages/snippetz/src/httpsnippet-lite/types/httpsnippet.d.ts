import type {
  Request as NpmHarRequest,
  Param,
  PostDataCommon,
} from 'har-format'

import type { ReducedHelperObject } from './helpers/reducer.js'
import type { ExtendedURL } from './helpers/url.js'
import type { ClientId, TargetId } from './targets/targets.js'

export { CodeBuilder } from './helpers/code-builder.js'
export { availableTargets, extname } from './helpers/utils.js'
export { isClient, isTarget } from './targets/targets.js'
export type { ClientId, TargetId }
export {
  addTarget,
  addTargetClient,
  isValidTargetId,
} from './targets/targets.js'
/**
 * is this wrong?  yes.  according to the spec (http://www.softwareishard.com/blog/har-12-spec/#postData) it's technically wrong since `params` and `text` are (by the spec) mutually exclusive.  However, in practice, this is not what is often the case.
 *
 * In general, this library takes a _descriptive_ rather than _perscriptive_ approach (see https://amyrey.web.unc.edu/classes/ling-101-online/tutorials/understanding-prescriptive-vs-descriptive-grammar/).
 *
 * Then, in addition to that, it really adds to complexity with TypeScript (TypeScript takes this constraint very very seriously) in a way that's not actually super useful.  So, we treat this object as though it could have both or either of `params` and/or `text`.
 */
type PostDataBase = PostDataCommon & {
  text?: string
  params?: Param[]
}
export type HarRequest = Omit<NpmHarRequest, 'postData'> & {
  postData?: PostDataBase
}
export type RequestExtras = {
  postData?: PostDataBase & {
    jsonObj?: ReducedHelperObject
    paramsObj?: ReducedHelperObject
    boundary?: string
  }
  fullUrl: string
  queryObj: ReducedHelperObject
  headersObj: ReducedHelperObject
  uriObj: ExtendedURL
  cookiesObj: ReducedHelperObject
  allHeaders: ReducedHelperObject
}
export type Request = HarRequest & RequestExtras
type Entry = {
  request: Partial<HarRequest>
}
type HarEntry = {
  log: {
    version: string
    creator: {
      name: string
      version: string
    }
    entries: Entry[]
  }
}
export declare class HTTPSnippet {
  readonly requests: Promise<Request[]>
  constructor(input: HarEntry | HarRequest)
  prepare(harRequest: HarRequest): Promise<{
    allHeaders: {
      [x: string]: string | string[]
    }
    fullUrl: string
    url: string
    uriObj: ExtendedURL
    method: string
    headers: import('har-format').Header[]
    comment?: string | undefined
    postData?:
      | (PostDataCommon & {
          text?: string | undefined
          params?: Param[] | undefined
        } & {
          jsonObj?: ReducedHelperObject | undefined
          paramsObj?: ReducedHelperObject | undefined
          boundary?: string | undefined
        })
      | undefined
    httpVersion: string
    cookies: import('har-format').Cookie[]
    queryString: import('har-format').QueryString[]
    headersSize: number
    bodySize: number
    headersObj: ReducedHelperObject
    queryObj: ReducedHelperObject
    cookiesObj: ReducedHelperObject
  }>
  convert(
    targetId: TargetId,
    clientId?: ClientId,
    options?: any,
  ): Promise<string | string[] | null>
}
