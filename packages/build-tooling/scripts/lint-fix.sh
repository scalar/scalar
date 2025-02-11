#!/bin/bash

pnpm prettier --write --ignore-path=../../.prettierignore .
# TODO: We don’t want to change all files now, to avoid merge conflicts.
# pnpm biome format --write
