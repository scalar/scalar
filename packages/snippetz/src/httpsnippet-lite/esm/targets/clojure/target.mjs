import { clj_http } from "./clj_http/client.mjs";
export const clojure = {
    info: {
        key: 'clojure',
        title: 'Clojure',
        extname: '.clj',
        default: 'clj_http',
    },
    clientsById: {
        clj_http,
    },
};
