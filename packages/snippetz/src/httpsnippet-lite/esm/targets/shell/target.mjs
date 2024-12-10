import { curl } from "./curl/client.mjs";
import { httpie } from "./httpie/client.mjs";
import { wget } from "./wget/client.mjs";
export const shell = {
    info: {
        key: 'shell',
        title: 'Shell',
        extname: '.sh',
        default: 'curl',
    },
    clientsById: {
        curl,
        httpie,
        wget,
    },
};
