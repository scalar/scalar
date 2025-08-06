export { fetchDocument } from './fetch-document'
export { type FetchWithProxyFallbackOptions, fetchWithProxyFallback } from './fetch-with-proxy-fallback'
export { normalizeMimeType } from './normalize-mime-type'
export { normalizeMimeTypeObject } from './normalize-mime-type-object'
export { formatJsonOrYamlString, isJsonString, json, parseJsonOrYaml, transformToJson, yaml } from './parse'
export { prettyPrintJson, replaceCircularDependencies } from './pretty-print-json'
export { shouldUseProxy, redirectToProxy } from './redirect-to-proxy'
export { schemaModel } from './schema-model'
export { shouldIgnoreEntity } from './should-ignore-entity'
export { isOperationDeprecated, getOperationStability, getOperationStabilityColor } from './operation-stability'
export { getServersFromDocument } from './servers'

/**
 * @deprecated These helpers are being phased out. Please import directly from @scalar/helpers instead.
 * For example: import { createHash } from '\@scalar/helpers/string/create-hash'
 */
export {
  /** @deprecated Please use createHash from \@scalar/helpers/string/create-hash instead */
  createHash,
} from '@scalar/helpers/string/create-hash'
export {
  /** @deprecated Please use isDefined from \@scalar/helpers/array/is-defined instead */
  isDefined,
} from '@scalar/helpers/array/is-defined'
export {
  /** @deprecated Please use isHttpMethod from \@scalar/helpers/http/is-http-method instead */
  isHttpMethod,
} from '@scalar/helpers/http/is-http-method'
export {
  /** @deprecated Please use combineUrlAndPath from \@scalar/helpers/url/merge-urls instead */
  combineUrlAndPath,
} from '@scalar/helpers/url/merge-urls'
export {
  /** @deprecated Please use json2xml from \@scalar/helpers/file/json2xml instead */
  json2xml,
} from '@scalar/helpers/file/json2xml'
export {
  /** @deprecated Please use capitalize from \@scalar/helpers/string/capitalize instead */
  capitalize,
} from '@scalar/helpers/string/capitalize'
export {
  /** @deprecated Please use camelToTitleWords from \@scalar/helpers/string/camel-to-title instead */
  camelToTitleWords,
} from '@scalar/helpers/string/camel-to-title'
export {
  /** @deprecated Please use REGEX from \@scalar/helpers/regex/regex-helpers instead */
  REGEX,
} from '@scalar/helpers/regex/regex-helpers'
export {
  /** @deprecated Please use isLocalUrl from \@scalar/helpers/url/is-local-url instead */
  isLocalUrl,
} from '@scalar/helpers/url/is-local-url'
export {
  /** @deprecated Please use isRelativePath from \@scalar/helpers/url/is-relative-path instead */
  isRelativePath,
} from '@scalar/helpers/url/is-relative-path'
export {
  /** @deprecated Please use ensureProtocol from \@scalar/helpers/url/ensure-protocol instead */
  ensureProtocol,
} from '@scalar/helpers/url/ensure-protocol'
export {
  /** @deprecated Please use findVariables from \@scalar/helpers/regex/find-variables instead */
  findVariables,
} from '@scalar/helpers/regex/find-variables'
export {
  /** @deprecated Please use canMethodHaveBody from \@scalar/helpers/http/can-method-have-body instead */
  canMethodHaveBody,
} from '@scalar/helpers/http/can-method-have-body'
export {
  /** @deprecated Please use getHttpMethodInfo from \@scalar/helpers/http/http-info instead */
  getHttpMethodInfo,
} from '@scalar/helpers/http/http-info'
export {
  /** @deprecated Please use REQUEST_METHODS from \@scalar/helpers/http/http-methods instead */
  REQUEST_METHODS,
} from '@scalar/helpers/http/http-info'
export {
  /** @deprecated Please use HttpStatusCode from \@scalar/helpers/http/http-status-codes instead */
  type HttpStatusCode,
  /** @deprecated Please use HttpStatusCodes from \@scalar/helpers/http/http-status-codes instead */
  type HttpStatusCodes,
  /** @deprecated Please use httpStatusCodes from \@scalar/helpers/http/http-status-codes instead */
  httpStatusCodes,
} from '@scalar/helpers/http/http-status-codes'
export {
  /** @deprecated Please use isValidUrl from \@scalar/helpers/url/is-valid-url instead */
  isValidUrl,
} from '@scalar/helpers/url/is-valid-url'
export {
  /** @deprecated Please use iterateTitle from \@scalar/helpers/string/iterate-title instead */
  iterateTitle,
} from '@scalar/helpers/string/iterate-title'
export {
  /** @deprecated Please use makeUrlAbsolute from \@scalar/helpers/url/make-url-absolute instead */
  makeUrlAbsolute,
} from '@scalar/helpers/url/make-url-absolute'
export {
  /** @deprecated Please use mergeSearchParams from \@scalar/helpers/url/merge-urls instead */
  mergeSearchParams,
  /** @deprecated Please use mergeUrls from \@scalar/helpers/url/merge-urls instead */
  mergeUrls,
} from '@scalar/helpers/url/merge-urls'
export {
  /** @deprecated Please use objectKeys from \@scalar/helpers/object/object-keys instead */
  objectKeys as getObjectKeys,
} from '@scalar/helpers/object/object-keys'
export {
  /** @deprecated Please use replaceVariables from \@scalar/helpers/regex/replace-variables instead */
  replaceVariables,
} from '@scalar/helpers/regex/replace-variables'
