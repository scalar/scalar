export const validRequestMethods = [
    'GET',
    'POST',
    'PUT',
    'HEAD',
    'DELETE',
    'PATCH',
    'OPTIONS',
    'CONNECT',
    'TRACE',
] as const

type RequestMethod = typeof validRequestMethods[number];

export function isRequestMethod(s: string): s is RequestMethod {
return validRequestMethods.includes(s as RequestMethod)
}

export const requestMethodColors: { [x in RequestMethod]: string } = {
    POST: 'var(--theme-color-green, var(--default-theme-color-green))',
    DELETE: 'var(--theme-color-red, var(--default-theme-color-red))',
    PATCH: 'var(--theme-color-yellow, var(--default-theme-color-yellow))',
    GET: 'var(--theme-color-blue, var(--default-theme-color-blue))',
    PUT: 'var(--theme-color-orange, var(--default-theme-color-orange))',
    OPTIONS: 'var(--theme-color-purple, var(--default-theme-color-purple))',
    HEAD: 'var(--theme-color-2, var(--default-theme-color-2))',
    CONNECT: 'var(--theme-color-2, var(--default-theme-color-2))',
    TRACE: 'var(--theme-color-2, var(--default-theme-color-2))',
}

export const requestMethodAbbreviations: { [x in RequestMethod]: string } = {
    POST: 'POST',
    DELETE: 'DEL',
    PATCH: 'PATCH',
    GET: 'GET',
    PUT: 'PUT',
    OPTIONS: 'OPTS',
    HEAD: 'HEAD',
    CONNECT: 'CONN',
    TRACE: 'TRACE',
}