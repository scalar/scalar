export type Collection = {
    type?: "collection";
    openapi?: (string | "3.0.0" | "3.1.0" | "4.0.0");
    jsonSchemaDialect?: string | undefined;
    info?: {
        title?: string;
        summary?: string | undefined;
        description?: string | undefined;
        termsOfService?: string | undefined;
        contact?: {
            name?: string | undefined;
            url?: string | undefined;
            email?: string | undefined;
        } | undefined;
        license?: {
            name?: string;
            identifier?: string | undefined;
            url?: string | undefined;
        } | undefined;
        version?: string;
    } | undefined;
    security?: {
        [x: string]: string[];
    }[];
    externalDocs?: {
        description?: string | undefined;
        url?: string;
    } | undefined;
    components?: {
        [x: string]: unknown;
    } | undefined;
    webhooks?: {
        [x: string]: unknown;
    } | undefined;
    uid?: string;
    securitySchemes?: string[];
    selectedServerUid?: string;
    servers?: (string)[];
    requests?: (string)[];
    tags?: (string)[];
    children?: (string)[];
    auth?: {
        [x: string]: {
            type?: "apiKey";
            name?: string;
            value?: string;
        } | {
            type?: "http";
            username?: string;
            password?: string;
            token?: string;
        } | {
            type?: "oauth-implicit";
            token?: string;
        } | {
            type?: "oauth-password";
            token?: string;
            username?: string;
            password?: string;
            clientSecret?: string;
        } | {
            type?: "oauth-clientCredentials";
            token?: string;
            clientSecret?: string;
        } | {
            type?: "oauth-authorizationCode";
            token?: string;
            clientSecret?: string;
        };
    };
};

export type Cookie = {
    uid?: string;
    name?: string;
    value?: string;
    domain?: string | undefined;
    expires?: Date | undefined;
    httpOnly?: boolean | undefined;
    maxAge?: number | undefined;
    partitioned?: boolean | undefined;
    path?: string | undefined;
    sameSite?: "Lax" | "Strict" | "None";
    secure?: boolean | undefined;
};

export type Environment = {
    uid?: string;
    name?: string;
    color?: string;
    value?: string;
    isDefault?: boolean | undefined;
};

export type Tag = {
    type?: "tag";
    name: string;
    description?: string | undefined;
    externalDocs?: {
        description?: string | undefined;
        url?: string;
    } | undefined;
    "x-scalar-children"?: {
        tagName: string;
    }[];
    uid?: string;
    children?: (string)[];
};

export type RequestExample = {
    type?: "requestExample";
    uid?: string;
    requestUid?: string;
    name?: string;
    body?: {
        raw?: {
            encoding?: "json" | "text" | "html" | "javascript" | "xml" | "yaml" | "edn";
            value?: string;
        } | undefined;
        formData?: {
            encoding?: "form-data" | "urlencoded";
            value?: {
                key?: string;
                value?: string;
                enabled?: boolean;
                file?: any | undefined;
                description?: string | undefined;
                refUid?: (string) | undefined;
                required?: boolean | undefined;
                enum?: string[] | undefined;
                type?: string | undefined;
                format?: string | undefined;
                minimum?: number | undefined;
                maximum?: number | undefined;
                default?: any | undefined;
                nullable?: boolean | undefined;
            }[];
        } | undefined;
        binary?: any | undefined;
        activeBody?: "raw" | "formData" | "binary";
    };
    parameters?: {
        path?: {
            key?: string;
            value?: string;
            enabled?: boolean;
            file?: any | undefined;
            description?: string | undefined;
            refUid?: (string) | undefined;
            required?: boolean | undefined;
            enum?: string[] | undefined;
            type?: string | undefined;
            format?: string | undefined;
            minimum?: number | undefined;
            maximum?: number | undefined;
            default?: any | undefined;
            nullable?: boolean | undefined;
        }[];
        query?: {
            key?: string;
            value?: string;
            enabled?: boolean;
            file?: any | undefined;
            description?: string | undefined;
            refUid?: (string) | undefined;
            required?: boolean | undefined;
            enum?: string[] | undefined;
            type?: string | undefined;
            format?: string | undefined;
            minimum?: number | undefined;
            maximum?: number | undefined;
            default?: any | undefined;
            nullable?: boolean | undefined;
        }[];
        headers?: {
            key?: string;
            value?: string;
            enabled?: boolean;
            file?: any | undefined;
            description?: string | undefined;
            refUid?: (string) | undefined;
            required?: boolean | undefined;
            enum?: string[] | undefined;
            type?: string | undefined;
            format?: string | undefined;
            minimum?: number | undefined;
            maximum?: number | undefined;
            default?: any | undefined;
            nullable?: boolean | undefined;
        }[];
        cookies?: {
            key?: string;
            value?: string;
            enabled?: boolean;
            file?: any | undefined;
            description?: string | undefined;
            refUid?: (string) | undefined;
            required?: boolean | undefined;
            enum?: string[] | undefined;
            type?: string | undefined;
            format?: string | undefined;
            minimum?: number | undefined;
            maximum?: number | undefined;
            default?: any | undefined;
            nullable?: boolean | undefined;
        }[];
    };
};

export type Request = {
    tags?: string[] | undefined;
    summary?: string | undefined;
    description?: string | undefined;
    operationId?: string | undefined;
    security?: {
        [x: string]: string[];
    }[] | undefined;
    requestBody?: any | undefined;
    parameters?: {
        in: "path" | "query" | "header" | "cookie";
        name: string;
        description?: string | undefined;
        required?: boolean;
        deprecated?: boolean;
        schema?: unknown | undefined;
        content?: unknown | undefined;
        style?: ("matrix" | "simple" | "form" | "label" | "spaceDelimited" | "pipeDelimited" | "deepObject") | undefined;
    }[] | undefined;
    externalDocs?: {
        description?: string | undefined;
        url?: string;
    } | undefined;
    deprecated?: boolean | undefined;
    responses?: {
        [x: string]: any;
    } | undefined;
    type?: "request";
    uid?: string;
    path?: string;
    method?: "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";
    servers?: (string)[];
    selectedServerUid?: string;
    examples?: (string)[];
    selectedSecuritySchemeUids?: (string)[];
};

export type SecurityScheme = {
    description?: string | undefined;
    type: "apiKey";
    name?: string;
    in?: ("query" | "header" | "cookie");
    uid?: string;
    nameKey?: string;
} | {
    description?: string | undefined;
    type: "http";
    scheme?: ("basic" | "bearer");
    bearerFormat?: ("JWT" | string);
    uid?: string;
    nameKey?: string;
} | {
    description?: string | undefined;
    type: "openIdConnect";
    openIdConnectUrl?: string;
    uid?: string;
    nameKey?: string;
} | {
    description?: string | undefined;
    type: "oauth2";
    flow?: ({
        refreshUrl?: string;
        scopes?: (Map<string, string | undefined> | {
            [x: string]: string | undefined;
        } | {});
        selectedScopes?: string[];
        type: "implicit";
        authorizationUrl?: string;
        "x-scalar-redirect-uri"?: string;
    } | {
        refreshUrl?: string;
        scopes?: (Map<string, string | undefined> | {
            [x: string]: string | undefined;
        } | {});
        selectedScopes?: string[];
        type: "password";
        tokenUrl?: string;
        username?: string;
        password?: string;
        clientSecret?: string;
        "x-scalar-redirect-uri"?: string;
    } | {
        refreshUrl?: string;
        scopes?: (Map<string, string | undefined> | {
            [x: string]: string | undefined;
        } | {});
        selectedScopes?: string[];
        type: "clientCredentials";
        tokenUrl?: string;
        "x-scalar-redirect-uri"?: string;
    } | {
        refreshUrl?: string;
        scopes?: (Map<string, string | undefined> | {
            [x: string]: string | undefined;
        } | {});
        selectedScopes?: string[];
        type: "authorizationCode";
        authorizationUrl?: string;
        "x-scalar-redirect-uri"?: string;
        tokenUrl?: string;
    });
    "x-scalar-client-id"?: string;
    uid?: string;
    nameKey?: string;
};

export type Server = {
    url?: string | undefined;
    description?: string | undefined;
    variables?: {
        [x: string]: {
            enum?: string[] | undefined;
            default?: string;
            description?: string | undefined;
        };
    } | undefined;
    uid?: string;
};

export type Workspace = {
    uid?: string;
    name?: string;
    description?: string;
    isReadOnly?: boolean;
    collections?: string[];
    environments?: string[];
    hotKeyConfig?: {
        modifiers?: (("Meta" | "Control" | "Shift" | "Alt" | "default"))[];
        hotKeys?: {
            [x: string]: {
                modifiers?: ((("Meta" | "Control" | "Shift" | "Alt" | "default"))[]) | undefined;
                event: "closeModal" | "navigateSearchResultsDown" | "selectSearchResult" | "navigateSearchResultsUp" | "openCommandPalette" | "toggleSidebar" | "addTopNav" | "closeTopNav" | "navigateTopNavLeft" | "navigateTopNavRight" | "focusAddressBar" | "jumpToTab" | "jumpToLastTab" | "focusRequestSearch";
            };
        } | undefined;
    } | undefined;
    activeEnvironmentId?: string;
    cookies?: string[];
    proxyUrl?: string | undefined;
    themeId?: ("alternate" | "default" | "moon" | "purple" | "solarized" | "bluePlanet" | "deepSpace" | "saturn" | "kepler" | "mars" | "none");
};

