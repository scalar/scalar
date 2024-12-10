import { curl } from "./curl/client.mjs";
import { guzzle } from "./guzzle/client.mjs";
import { http1 } from "./http1/client.mjs";
import { http2 } from "./http2/client.mjs";
export const php = {
    info: {
        key: 'php',
        title: 'PHP',
        extname: '.php',
        default: 'curl',
    },
    clientsById: {
        curl,
        guzzle,
        http1,
        http2,
    },
};
