/**
 * Collection of regular expressions used throughout the application.
 * These patterns handle URL parsing, variable detection, and reference path extraction.
 */
export const REGEX = {
  /** Checks for a valid scheme */
  PROTOCOL: /^(?:https?|ftp|file|mailto|tel|data|wss?)*:\/\//,
  /** Finds multiple slashes after the scheme to replace with a single slash */
  MULTIPLE_SLASHES: /(?<!:)\/{2,}/g,
  /** Finds all variables wrapped in {{double}} */
  VARIABLES: /{{((?:[^{}]|{[^{}]*})*)}}/g,
  /** Finds all variables wrapped in {single} */
  PATH: /(?:{)([^{}]+)}(?!})/g,
  /** Finds the name of the schema from the ref path */
  REF_NAME: /\/([^\/]+)$/,
  /** Finds template variables in multiple formats: {{var}}, {var}, or :var */
  TEMPLATE_VARIABLE: /{{\s*([^}\s]+?)\s*}}|{\s*([^}\s]+?)\s*}|:\b[\w.]+\b/g,
} as const
