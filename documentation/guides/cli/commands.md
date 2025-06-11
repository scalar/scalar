# Commands
This guide has a full exhaustive list of all our CLI commands to make working with markdown, MDX, OpenAPI & the Scalar platform a breeze.

## Overview

- [scalar](#scalar) CLI to work with OpenAPI files, Markdown/MDX, Scalar Platform
- [auth](#auth) Manage authorization on Scalar platform
- [document](#document) Manage local openapi files
- [project](#project) Manage Scalar docs project
- [registry](#registry) Manage your Scalar registry
- [team](#team) Manage user teams
- [help](#help) Display help for command

## scalar
```
Usage: scalar [options] [command]

CLI to work with your OpenAPI files

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  auth            Manage authorization on scalar platform
  document        Manage local openapi file
  project         Manage scalar project
  registry        Manage your scalar registry
  team            Manage user teams
  help [command]  display help for command
```

## auth
```
Usage: scalar auth [options] [command]

Manage authorization on scalar platform

Options:
  -h, --help       display help for command

Commands:
  login [options]  Login to scalar
  whoami           Display the current user
  logout           Logout from scalar
  help [command]   display help for command
```

### login
```
Usage: scalar auth login [options]

Login to scalar

Options:
  --email <email>        Email
  --password <password>  Password
  --token <token>        Personal token
  -h, --help             display help for command
```

### whoami
```
Usage: scalar auth whoami [options]

Display the current user

Options:
  -h, --help  display help for command
```

### logout
```
Usage: scalar auth logout [options]

Logout from scalar

Options:
  -h, --help  display help for command
```

## document
```
Usage: scalar document [options] [command]

Manage local openapi file

Options:
  -h, --help                    display help for command

Commands:
  bundle [options] [file|url]   Bundle an OpenAPI specification by resolving all references and external dependencies
  format [options] [file|url]   Format an OpenAPI file
  mock [options] [file|url]     Mock an API from an OpenAPI file
  serve [options] [file|url]    Serve an API Reference from an OpenAPI file
  share [options] [file]        Share an OpenAPI file
  validate [file|url]           Validate an OpenAPI file
  void [options]                Boot a server to mirror HTTP requests
  lint [options] [file|url]     Lint your OpenAPI file using spectral rules
  upgrade [options] [file|url]  Upgrade OpenAPI document to version 3.1
  help [command]                display help for command
```

### bundle
```
Usage: scalar document bundle [options] [file|url]

Bundle an OpenAPI specification by resolving all references and external dependencies

Arguments:
  file|url              Path to OpenAPI file or URL to bundle

Options:
  -o, --output <file>   Path to save the bundled output file
  --treeShake           Remove unused components from the bundled output
  --urlMap              Generate a map of resolved URLs in the bundled output
  --fetchLimit <limit>  Maximum number of URLs to fetch during bundling at the same time
  -h, --help            display help for command
```

### format
```
Usage: scalar document format [options] [file|url]

Format an OpenAPI file

Arguments:
  file|url             File or URL to format

Options:
  -o, --output <file>  Output file
  -h, --help           display help for command
```

### mock
```
Usage: scalar document mock [options] [file|url]

Mock an API from an OpenAPI file

Arguments:
  file|url           OpenAPI file or URL to mock the server for

Options:
  -w, --watch        watch the file for changes
  -o, --once         run the server only once and exit after that
  -p, --port <port>  set the HTTP port for the mock server
  -h, --help         display help for command
```

### serve
```
Usage: scalar document serve [options] [file|url]

Serve an API Reference from an OpenAPI file

Arguments:
  file|url           OpenAPI file or URL to show the reference for

Options:
  -w, --watch        watch the file for changes
  -o, --once         run the server only once and exit after that
  -p, --port <port>  set the HTTP port for the API reference server
  -h, --help         display help for command
```

### share
```
Usage: scalar document share [options] [file]

Share an OpenAPI file

Arguments:
  file                 file to share

Options:
  -t, --token <token>  pass a token to update an existing sandbox
  -h, --help           display help for command
```

### validate
```
Usage: scalar document validate [options] [file|url]

Validate an OpenAPI file

Arguments:
  file|url    File or URL to validate

Options:
  -h, --help  display help for command
```

### void
```
Usage: scalar document void [options]

Boot a server to mirror HTTP requests

Options:
  -o, --once         run the server only once and exit after that
  -p, --port <port>  set the HTTP port for the mock server
  -h, --help         display help for command
```

### lint
```
Usage: scalar document lint [options] [file|url]

Lint your OpenAPI file using spectral rules

Arguments:
  file|url               OpenAPI file path or url

Options:
  -r, --rule <file|url>  Rule path or url
  -h, --help             display help for command
```

### upgrade
```
Usage: scalar document upgrade [options] [file|url]

Upgrade OpenAPI document to version 3.1

Arguments:
  file|url             File or URL to validate

Options:
  -o, --output <file>  Path to save the upgraded output file
  -h, --help           display help for command
```

## project
```
Usage: scalar project [options] [command]

Manage scalar project

Options:
  -h, --help           display help for command

Commands:
  init [options]       Create a new `scalar.config.json` file to configure where your OpenAPI file is placed.
  check-config [file]  Check a Scalar Configuration file
  create [options]     Create a new project that is not linked to a github project.
  preview [config]     Preview scalar guides
  publish [options]    Publish new build for a github sync project that is not linked.
  help [command]       display help for command
```

### init
```
Usage: scalar project init [options]

Create a new `scalar.config.json` file to configure where your OpenAPI file is placed.

Options:
  -f, --file [file]      your OpenAPI file
  -s, --subdomain [url]  subdomain to publish on
  --force                override existing configuration
  -h, --help             display help for command
```

### check-config
```
Usage: scalar project check-config [options] [file]

Check a Scalar Configuration file

Arguments:
  file        File to check

Options:
  -h, --help  display help for command
```

### create
```
Usage: scalar project create [options]

Create a new project that is not linked to a github project.

Options:
  -n, --name [name]  name of your project
  -s, --slug [slug]  project slug
  -h, --help         display help for command
```

### preview
```
Usage: scalar project preview [options] [config]

Preview scalar guides

Arguments:
  config      your config file of the project

Options:
  -h, --help  display help for command
```

### publish
```
Usage: scalar project publish [options]

Publish new build for a github sync project that is not linked.

Options:
  -s, --slug [slug]      project slug
  -c, --config [config]  your config file of the project
  -h, --help             display help for command
```

## registry
```
Usage: scalar registry [options] [command]

Manage your scalar registry

Options:
  -h, --help                           display help for command

Commands:
  create [options] [file]              Create a document on scalar registry
  update [options] [namespace] [slug]  Update document metadata on scalar registry
  delete [namespace] [slug]            Delete a document from scalar registry
  version [options] [slug] [file]      Upload a new document version to an API on scalar registry
  list [options]                       List all registry APIs for a team namespace
  help [command]                       display help for command
```

### create
```
Usage: scalar registry create [options] [file]

Create a document on scalar registry

Arguments:
  file                         file to upload

Options:
  --namespace <namespace>      Namespace
  --title <title>              Document title
  --description <description>  Document description
  --doc-version <doc-version>  Document version
  -h, --help                   display help for command
```

### update
```
Usage: scalar registry update [options] [namespace] [slug]

Update document metadata on scalar registry

Arguments:
  namespace                    namespace of document you want to update
  slug                         slug of document you want to update

Options:
  --title <title>              Document title
  --description <description>  Document description
  -h, --help                   display help for command
```

### delete
```
Usage: scalar registry delete [options] [namespace] [slug]

Delete a document from scalar registry

Arguments:
  namespace   Team namespace
  slug        Managed doc slug

Options:
  -h, --help  display help for command
```

### version
```
Usage: scalar registry version [options] [slug] [file]

Upload a new document version to an API on scalar registry

Arguments:
  slug                         Slug of the registry API you want to version
  file                         File to upload

Options:
  --namespace <namespace>      Team namespace
  --doc-version <doc-version>  API version to create or update
  --force <force>              Force override an existing version
  -h, --help                   display help for command
```

### list
```
Usage: scalar registry list [options]

List all registry APIs for a team namespace

Options:
  --namespace <namespace>  Team namespace
  -h, --help               display help for command
```

## team
```
Usage: scalar team [options] [command]

Manage user teams

Options:
  -h, --help      display help for command

Commands:
  list            List all teams current user is part of
  set [options]   Set current active team for the user
  help [command]  display help for command
```

### list
```
Usage: scalar team list [options]

List all teams current user is part of

Options:
  -h, --help  display help for command
```

### set
```
Usage: scalar team set [options]

Set current active team for the user

Options:
  --team <team>  Team uid
  -h, --help     display help for command
```