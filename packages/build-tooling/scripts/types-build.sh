#!/bin/bash
set -e

tsc -p tsconfig.build.json
tsc-alias -p tsconfig.build.json
