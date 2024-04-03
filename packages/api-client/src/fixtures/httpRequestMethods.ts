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

export type RequestMethod = typeof validRequestMethods[number];

export function isRequestMethod(s: string): s is RequestMethod {
return validRequestMethods.includes(s as RequestMethod)
}

export const requestMethodColors: { [x in RequestMethod]: string } = {
    POST: 'var(--scalar-color-green, var(--default-scalar-color-green))',
    DELETE: 'var(--scalar-color-red, var(--default-scalar-color-red))',
    PATCH: 'var(--scalar-color-yellow, var(--default-scalar-color-yellow))',
    GET: 'var(--scalar-color-blue, var(--default-scalar-color-blue))',
    PUT: 'var(--scalar-color-orange, var(--default-scalar-color-orange))',
    OPTIONS: 'var(--scalar-color-purple, var(--default-scalar-color-purple))',
    HEAD: 'var(--scalar-color-2, var(--default-scalar-color-2))',
    CONNECT: 'var(--scalar-color-2, var(--default-scalar-color-2))',
    TRACE: 'var(--scalar-color-2, var(--default-scalar-color-2))',
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