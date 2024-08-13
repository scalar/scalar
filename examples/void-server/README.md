# Scalar Void Server

[![Version](https://img.shields.io/npm/v/%40scalar/void-server)](https://www.npmjs.com/package/@scalar/void-server)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/void-server)](https://www.npmjs.com/package/@scalar/void-server)
[![License](https://img.shields.io/npm/l/%40scalar%2Fvoid-server)](https://www.npmjs.com/package/@scalar/void-server)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

An example implementation of the `@scalar/void-server`

## Installation

```bash
npm i
npm run dev
```

## Usage

Send a request to the void-server and recieve the request data as the response.

```bash
curl http://localhost:5052

{"method":"GET","path":"/","headers":{"accept":"*/*","host":"localhost:5052","user-agent":"curl/8.6.0"},"cookies":{},"query":{},"body":""}
```

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/packages/void-server/LICENSE).
