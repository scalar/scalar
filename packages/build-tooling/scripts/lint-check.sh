#!/bin/bash

pnpm prettier --check --ignore-path=../../.prettierignore .
pnpm biome check
