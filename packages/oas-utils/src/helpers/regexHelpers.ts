export const REGEX = {
  /** Checks for a valid scheme */
  PROTOCOL: /^(?:https?|ftp|file|mailto|tel|data|wss?)*:\/\//,
  VARIABLES: /{{((?:[^{}]|{[^{}]*})*)}}/g,
  PATH: /(?:{)([^{}]+)}(?!})/g,
  TEMPLATE_VARIABLE: /{{\s*([^}\s]+?)\s*}}|{\s*([^}\s]+?)\s*}|:\b[\w.]+\b/g,
} as const
