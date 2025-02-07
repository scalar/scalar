export const REGEX = {
  /** Checks for a valid scheme */
  PROTOCOL: /^(?:https?|ftp|file|mailto|tel|data|wss?)*:\/\//,
  /** Finds multiple slashes after the scheme to replace with a single slash */
  MULTIPLE_SLASHES: /(?<!:)\/{2,}/g,
  VARIABLES: /{{((?:[^{}]|{[^{}]*})*)}}/g,
  PATH: /(?:{)([^{}]+)}(?!})/g,
  TEMPLATE_VARIABLE: /{{\s*([^}\s]+?)\s*}}|{\s*([^}\s]+?)\s*}|:\b[\w.]+\b/g,
} as const
