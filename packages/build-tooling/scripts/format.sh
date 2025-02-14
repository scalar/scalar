#!/bin/bash
set -e

biome format --write
prettier --write .
