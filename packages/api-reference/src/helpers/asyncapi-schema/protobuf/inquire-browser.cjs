/**
 * Browser bundles have no Node require for protobufjs to discover optional modules.
 * Match its unavailable-module result without the direct eval that prevents minification.
 * Keep the CommonJS export because protobufjs calls the result of require directly.
 * @returns {null}
 */
module.exports = () => null
