import { restmethod } from "./restmethod/client.mjs";
import { webrequest } from "./webrequest/client.mjs";
export const powershell = {
    info: {
        key: 'powershell',
        title: 'Powershell',
        extname: '.ps1',
        default: 'webrequest',
    },
    clientsById: {
        webrequest,
        restmethod,
    },
};
