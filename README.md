# Scalar API Reference

[![CI](https://github.com/scalar/scalar/actions/workflows/ci.yml/badge.svg)](https://github.com/scalar/scalar/actions/workflows/ci.yml)
[![Release](https://github.com/scalar/scalar/actions/workflows/release.yml/badge.svg)](https://github.com/scalar/scalar/actions/workflows/release.yml)
[![Contributors](https://img.shields.io/github/contributors/scalar/scalar)](https://github.com/scalar/scalar/graphs/contributors)
[![GitHub License](https://img.shields.io/github/license/scalar/scalar)](https://github.com/scalar/scalar/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

Generate interactive API documentation from OpenAPI/Swagger documents. [Try our Demo](https://docs.scalar.com/swagger-editor)

<img width="830" height="455" src="https://github.com/scalar/scalar/assets/6201407/046aaeca-f0fe-453d-a661-c747399c56ef">

## Features

- Uses OpenAPI/Swagger documents
- Request examples for many favorite languages and frameworks
- Comes with an integrated API client
- Integrates with your favorite framework
- Doesn’t look like it’s 2011

## Quickstart

You’re just one HTML file away from having an awesome API reference:

```html
<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <!-- Need a Custom Header? Check out this example https://codepen.io/scalarorg/pen/VwOXqam -->
    <script
      id="api-reference"
      data-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
```

And there’s an ever-growing list of plugins and integrations:

## Integrations

- [.NET](packages/scalar.aspnetcore/README.md)
- [AdonisJS](documentation/adonisjs.md)
- [Docusaurus](packages/docusaurus/README.md)
- [ElysiaJS](documentation/elysiajs.md)
- [Express](packages/express-api-reference/README.md)
- [FastAPI](packages/scalar_fastapi/README.md)
- [Fastify](packages/fastify-api-reference/README.md)
- [Go](documentation/go.md)
- [Hono](packages/hono-api-reference/README.md)
- [Laravel](documentation/laravel.md)
- [Litestar](https://docs.litestar.dev/latest/usage/openapi/ui_plugins.html)
- [NestJS](packages/nestjs-api-reference/README.md)
- [Next.js](packages/nextjs-api-reference/README.md)
- [Nitro](documentation/nitro.md)
- [Nuxt](packages/nuxt/README.md)
- [Platformatic](documentation/platformatic.md)
- [React](packages/api-reference-react/README.md)
- [Rust](documentation/rust.md)
- [Vue.js](packages/api-reference/README.md)

## Managed Hosting

We’re offering a free and paid managed hosting on the edge, too:

- Write your API documentation and publish your API references (free)
- Get SSL and a super cool `*.apidocumentation.com` subdomain (free)
- Write free text documentation (paid)
- Collaborate with your whole team (paid)
- Use any domain (paid)

Ready? [Create your account on scalar.com](https://scalar.com).

## Projects

| Project                                                            | Description            |
| ------------------------------------------------------------------ | ---------------------- |
| [Scalar API Client](packages/api-client/README.md)                 | API client             |
| [Scalar CLI](packages/cli/README.md)                               | Command-line interface |
| [Scalar Galaxy](packages/galaxy/README.md)                         | OpenAPI Example        |
| [Scalar Play Button](packages/play-button/README.md)               | Quick API Client Embed |
| [Scalar Mock Server](packages/mock-server/README.md)               | OpenAPI Mock Server    |
| [Scalar Void Server](packages/void-server/README.md)               | HTTP Request Mirror    |
| [Scalar Open API Parser](https://github.com/scalar/openapi-parser) | OpenAPI SDK            |
| [Scalar Sandbox](https://sandbox.scalar.com/)                      | Online OpenAPI Editor  |

## Documentation

| Topic                                           | Description                        |
| ----------------------------------------------- | ---------------------------------- |
| [Themes](documentation/themes.md)               | Themes, layouts & styling          |
| [Configuration](documentation/configuration.md) | The universal configuration object |
| [OpenAPI](documentation/openapi.md)             | OpenAPI and our extensions to it   |
| [Markdown](documentation/markdown.md)           | Markdown syntax                    |

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

> [!NOTE]\
> [Scalar Townhall every 2nd Thursday in Discord](https://discord.gg/scalar?event=1219363385485824000)
>
> Join us to see upcoming features, discuss the roadmap and chat about APIs. 💬

## Contributors

Contributions are welcome! Read the [`CONTRIBUTING`](https://github.com/scalar/scalar/blob/main/CONTRIBUTING) guide.

<!-- readme: collaborators,contributors -start -->
<table>
	<tbody>
		<tr>
            <td align="center">
                <a href="https://github.com/hanspagel">
                    <img src="https://avatars.githubusercontent.com/u/1577992?v=4" width="100;" alt="hanspagel"/>
                    <br />
                    <sub><b>hanspagel</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/amritk">
                    <img src="https://avatars.githubusercontent.com/u/2039539?v=4" width="100;" alt="amritk"/>
                    <br />
                    <sub><b>amritk</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/tmastrom">
                    <img src="https://avatars.githubusercontent.com/u/36525329?v=4" width="100;" alt="tmastrom"/>
                    <br />
                    <sub><b>tmastrom</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/marclave">
                    <img src="https://avatars.githubusercontent.com/u/6176314?v=4" width="100;" alt="marclave"/>
                    <br />
                    <sub><b>marclave</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/hwkr">
                    <img src="https://avatars.githubusercontent.com/u/6374090?v=4" width="100;" alt="hwkr"/>
                    <br />
                    <sub><b>hwkr</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/cameronrohani">
                    <img src="https://avatars.githubusercontent.com/u/6201407?v=4" width="100;" alt="cameronrohani"/>
                    <br />
                    <sub><b>cameronrohani</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/antlio">
                    <img src="https://avatars.githubusercontent.com/u/14966155?v=4" width="100;" alt="antlio"/>
                    <br />
                    <sub><b>antlio</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/geoffgscott">
                    <img src="https://avatars.githubusercontent.com/u/59206100?v=4" width="100;" alt="geoffgscott"/>
                    <br />
                    <sub><b>geoffgscott</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Amorim33">
                    <img src="https://avatars.githubusercontent.com/u/42624869?v=4" width="100;" alt="Amorim33"/>
                    <br />
                    <sub><b>Amorim33</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/adjsky">
                    <img src="https://avatars.githubusercontent.com/u/49305219?v=4" width="100;" alt="adjsky"/>
                    <br />
                    <sub><b>adjsky</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ATREAY">
                    <img src="https://avatars.githubusercontent.com/u/66585295?v=4" width="100;" alt="ATREAY"/>
                    <br />
                    <sub><b>ATREAY</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Mohib834">
                    <img src="https://avatars.githubusercontent.com/u/47316464?v=4" width="100;" alt="Mohib834"/>
                    <br />
                    <sub><b>Mohib834</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/mcollina">
                    <img src="https://avatars.githubusercontent.com/u/52195?v=4" width="100;" alt="mcollina"/>
                    <br />
                    <sub><b>mcollina</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/soulchild">
                    <img src="https://avatars.githubusercontent.com/u/59642?v=4" width="100;" alt="soulchild"/>
                    <br />
                    <sub><b>soulchild</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/hex0id">
                    <img src="https://avatars.githubusercontent.com/u/5276261?v=4" width="100;" alt="hex0id"/>
                    <br />
                    <sub><b>hex0id</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/mpminardi">
                    <img src="https://avatars.githubusercontent.com/u/8587567?v=4" width="100;" alt="mpminardi"/>
                    <br />
                    <sub><b>mpminardi</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ykdojo">
                    <img src="https://avatars.githubusercontent.com/u/1811651?v=4" width="100;" alt="ykdojo"/>
                    <br />
                    <sub><b>ykdojo</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/mouhannad-sh">
                    <img src="https://avatars.githubusercontent.com/u/18495740?v=4" width="100;" alt="mouhannad-sh"/>
                    <br />
                    <sub><b>mouhannad-sh</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/gsmcdonald">
                    <img src="https://avatars.githubusercontent.com/u/36003378?v=4" width="100;" alt="gsmcdonald"/>
                    <br />
                    <sub><b>gsmcdonald</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/federicobond">
                    <img src="https://avatars.githubusercontent.com/u/138426?v=4" width="100;" alt="federicobond"/>
                    <br />
                    <sub><b>federicobond</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/sigpwned">
                    <img src="https://avatars.githubusercontent.com/u/1236302?v=4" width="100;" alt="sigpwned"/>
                    <br />
                    <sub><b>sigpwned</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Mason-Little">
                    <img src="https://avatars.githubusercontent.com/u/105008441?v=4" width="100;" alt="Mason-Little"/>
                    <br />
                    <sub><b>Mason-Little</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/MaxBreida">
                    <img src="https://avatars.githubusercontent.com/u/18685579?v=4" width="100;" alt="MaxBreida"/>
                    <br />
                    <sub><b>MaxBreida</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/rickihastings">
                    <img src="https://avatars.githubusercontent.com/u/45660?v=4" width="100;" alt="rickihastings"/>
                    <br />
                    <sub><b>rickihastings</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/rbange">
                    <img src="https://avatars.githubusercontent.com/u/13252574?v=4" width="100;" alt="rbange"/>
                    <br />
                    <sub><b>rbange</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/STP5940">
                    <img src="https://avatars.githubusercontent.com/u/21144303?v=4" width="100;" alt="STP5940"/>
                    <br />
                    <sub><b>STP5940</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/realsama">
                    <img src="https://avatars.githubusercontent.com/u/46403284?v=4" width="100;" alt="realsama"/>
                    <br />
                    <sub><b>realsama</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/SebastianBienert">
                    <img src="https://avatars.githubusercontent.com/u/17458785?v=4" width="100;" alt="SebastianBienert"/>
                    <br />
                    <sub><b>SebastianBienert</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/dotfortun">
                    <img src="https://avatars.githubusercontent.com/u/11822957?v=4" width="100;" alt="dotfortun"/>
                    <br />
                    <sub><b>dotfortun</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/soGit">
                    <img src="https://avatars.githubusercontent.com/u/10682798?v=4" width="100;" alt="soGit"/>
                    <br />
                    <sub><b>soGit</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/sinh117801">
                    <img src="https://avatars.githubusercontent.com/u/43696715?v=4" width="100;" alt="sinh117801"/>
                    <br />
                    <sub><b>sinh117801</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Chinlinlee">
                    <img src="https://avatars.githubusercontent.com/u/49154622?v=4" width="100;" alt="Chinlinlee"/>
                    <br />
                    <sub><b>Chinlinlee</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/WilliamBonvini">
                    <img src="https://avatars.githubusercontent.com/u/37834150?v=4" width="100;" alt="WilliamBonvini"/>
                    <br />
                    <sub><b>WilliamBonvini</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/x-delfino">
                    <img src="https://avatars.githubusercontent.com/u/67192579?v=4" width="100;" alt="x-delfino"/>
                    <br />
                    <sub><b>x-delfino</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/FotieMConstant">
                    <img src="https://avatars.githubusercontent.com/u/42372656?v=4" width="100;" alt="FotieMConstant"/>
                    <br />
                    <sub><b>FotieMConstant</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/dunklesToast">
                    <img src="https://avatars.githubusercontent.com/u/17279485?v=4" width="100;" alt="dunklesToast"/>
                    <br />
                    <sub><b>dunklesToast</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/tsiwek-piwik">
                    <img src="https://avatars.githubusercontent.com/u/117373332?v=4" width="100;" alt="tsiwek-piwik"/>
                    <br />
                    <sub><b>tsiwek-piwik</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/arashsheyda">
                    <img src="https://avatars.githubusercontent.com/u/38922203?v=4" width="100;" alt="arashsheyda"/>
                    <br />
                    <sub><b>arashsheyda</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/arthurfiorette">
                    <img src="https://avatars.githubusercontent.com/u/47537704?v=4" width="100;" alt="arthurfiorette"/>
                    <br />
                    <sub><b>arthurfiorette</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/chrislearn">
                    <img src="https://avatars.githubusercontent.com/u/5874864?v=4" width="100;" alt="chrislearn"/>
                    <br />
                    <sub><b>chrislearn</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/danp">
                    <img src="https://avatars.githubusercontent.com/u/2182?v=4" width="100;" alt="danp"/>
                    <br />
                    <sub><b>danp</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/lundibundi">
                    <img src="https://avatars.githubusercontent.com/u/9109612?v=4" width="100;" alt="lundibundi"/>
                    <br />
                    <sub><b>lundibundi</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/Edgaraszs">
                    <img src="https://avatars.githubusercontent.com/u/55696268?v=4" width="100;" alt="Edgaraszs"/>
                    <br />
                    <sub><b>Edgaraszs</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/emmanuel-ferdman">
                    <img src="https://avatars.githubusercontent.com/u/35470921?v=4" width="100;" alt="emmanuel-ferdman"/>
                    <br />
                    <sub><b>emmanuel-ferdman</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Fdawgs">
                    <img src="https://avatars.githubusercontent.com/u/43814140?v=4" width="100;" alt="Fdawgs"/>
                    <br />
                    <sub><b>Fdawgs</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/GreyXor">
                    <img src="https://avatars.githubusercontent.com/u/79602273?v=4" width="100;" alt="GreyXor"/>
                    <br />
                    <sub><b>GreyXor</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/HelgeSverre">
                    <img src="https://avatars.githubusercontent.com/u/1089652?v=4" width="100;" alt="HelgeSverre"/>
                    <br />
                    <sub><b>HelgeSverre</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/CJHwong">
                    <img src="https://avatars.githubusercontent.com/u/906057?v=4" width="100;" alt="CJHwong"/>
                    <br />
                    <sub><b>CJHwong</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/IceyWu">
                    <img src="https://avatars.githubusercontent.com/u/66096254?v=4" width="100;" alt="IceyWu"/>
                    <br />
                    <sub><b>IceyWu</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/JacobCoffee">
                    <img src="https://avatars.githubusercontent.com/u/45884264?v=4" width="100;" alt="JacobCoffee"/>
                    <br />
                    <sub><b>JacobCoffee</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/jonataw">
                    <img src="https://avatars.githubusercontent.com/u/29772763?v=4" width="100;" alt="jonataw"/>
                    <br />
                    <sub><b>jonataw</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/IHIutch">
                    <img src="https://avatars.githubusercontent.com/u/20825047?v=4" width="100;" alt="IHIutch"/>
                    <br />
                    <sub><b>IHIutch</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/KiARC">
                    <img src="https://avatars.githubusercontent.com/u/73847484?v=4" width="100;" alt="KiARC"/>
                    <br />
                    <sub><b>KiARC</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/kyllian">
                    <img src="https://avatars.githubusercontent.com/u/5831233?v=4" width="100;" alt="kyllian"/>
                    <br />
                    <sub><b>kyllian</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/ShadiestGoat">
                    <img src="https://avatars.githubusercontent.com/u/48590492?v=4" width="100;" alt="ShadiestGoat"/>
                    <br />
                    <sub><b>ShadiestGoat</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/MarioGK">
                    <img src="https://avatars.githubusercontent.com/u/8379079?v=4" width="100;" alt="MarioGK"/>
                    <br />
                    <sub><b>MarioGK</b></sub>
                </a>
            </td>
		</tr>
	<tbody>
</table>
<!-- readme: collaborators,contributors -end -->
