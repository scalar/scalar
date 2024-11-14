export const variableRegex = /{{((?:[^{}]|{[^{}]*})*)}}/g
export const pathRegex = /(?<!{){([^{}]+)}(?!})/g
export const templateVariableRegex =
  /{{\s*([^}\s]+?)\s*}}|{\s*([^}\s]+?)\s*}|:\b[\w.]+\b/g
