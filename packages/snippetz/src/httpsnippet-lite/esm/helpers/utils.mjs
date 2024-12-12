import { targets } from "../targets/targets.mjs";
export const availableTargets = () => Object.keys(targets).map(targetId => ({
    ...targets[targetId].info,
    clients: Object.keys(targets[targetId].clientsById).map(clientId => targets[targetId].clientsById[clientId].info),
}));
export const extname = (targetId) => { var _a; return ((_a = targets[targetId]) === null || _a === void 0 ? void 0 : _a.info.extname) || ''; };
