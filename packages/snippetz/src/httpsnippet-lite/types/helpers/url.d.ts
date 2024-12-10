/// <reference types="node" resolution-mode="require"/>
import type { ReducedHelperObject } from './reducer.js'

export declare function toSearchParams(
  obj: ReducedHelperObject,
): URLSearchParams
export declare class ExtendedURL extends URL {
  get path(): string
}
