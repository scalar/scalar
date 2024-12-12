/**
 * Use 'strong quoting' using single quotes so that we only need to deal with nested single quote characters.
 * see: http://wiki.bash-hackers.org/syntax/quoting#strong_quoting
 */
export declare const quote: (value?: string) => string
export declare const escape: (value: string) => string
