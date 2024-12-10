import { axios } from "./axios/client.mjs";
import { fetch } from "./fetch/client.mjs";
import { jquery } from "./jquery/client.mjs";
import { xhr } from "./xhr/client.mjs";
export const javascript = {
    info: {
        key: 'javascript',
        title: 'JavaScript',
        extname: '.js',
        default: 'xhr',
    },
    clientsById: {
        xhr,
        axios,
        fetch,
        jquery,
    },
};
