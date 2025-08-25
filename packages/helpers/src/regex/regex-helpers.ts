export const REGEX = {
  /** Checks for a valid scheme */
  PROTOCOL: /^(?:https?|ftp|file|mailto|tel|data|wss?)*:\/\//,
  /** Finds multiple slashes after the scheme to replace with a single slash */
  MULTIPLE_SLASHES: /(?<!:)\/{2,}/g,
  VARIABLES: /{{((?:[^{}]|{[^{}]*})*)}}/g,
  PATH: /(?:{)([^{}]+)}(?!})/g,
  /** Finds the name of the schema from the ref path */
  REF_NAME: /\/([^\/]+)$/,
  TEMPLATE_VARIABLE: /{{\s*([^}\s]+?)\s*}}|{\s*([^}\s]+?)\s*}|:\b[\w.]+\b/g,
} as const
