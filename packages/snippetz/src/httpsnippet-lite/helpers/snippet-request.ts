import type { HarRequest as NpmHarRequest, FormDataParam as Param, PostDataCommon } from '@scalar/types/snippetz'

import type { ReducedHelperObject } from '@/httpsnippet-lite/helpers/reducer'
import type { ExtendedURL } from '@/httpsnippet-lite/helpers/url'

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
type HarRequest = Omit<NpmHarRequest, 'postData'> & {
  postData?: PostDataBase
}
type RequestExtras = {
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

export type SnippetRequest = HarRequest & RequestExtras
