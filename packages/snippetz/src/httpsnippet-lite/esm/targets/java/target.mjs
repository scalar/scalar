import { asynchttp } from "./asynchttp/client.mjs";
import { nethttp } from "./nethttp/client.mjs";
import { okhttp } from "./okhttp/client.mjs";
import { unirest } from "./unirest/client.mjs";
export const java = {
    info: {
        key: 'java',
        title: 'Java',
        extname: '.java',
        default: 'unirest',
    },
    clientsById: {
        asynchttp,
        nethttp,
        okhttp,
        unirest,
    },
};
