#!/bin/bash

rollup -c rollup.config.ts --configPlugin typescript && pnpm types:build
