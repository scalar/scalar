# Direct Markdown AST benchmark results

Baseline: `f3c39a6723` (Vue SSR → HTML → Markdown). Replacement: `codex/openapi-markdown-ast`.

Measured on Apple M4, darwin arm64, Node v24.8.0. Five independent process samples per implementation and workload; old/new order alternates.

## End-to-end first export

Includes document preparation and the first render/export. Module import time is excluded. For separate pages, this includes preparing once and rendering all 100 pages. Values are medians of each sample’s combined time, not sums of separate medians.

| Workload                                    | Old elapsed ms | New elapsed ms | Speedup |
| ------------------------------------------- | -------------: | -------------: | ------: |
| Scalar Galaxy 3.1                           |          970.9 |          217.9 |    4.5× |
| 10 operations                               |          170.9 |           41.9 |    4.1× |
| 200 operations                              |        9,788.4 |        1,032.8 |    9.5× |
| 100 operations, rich descriptions           |        2,324.5 |          338.2 |    6.9× |
| One operation from a 200-operation document |          142.8 |          101.1 |    1.4× |
| 100 separate operation pages                |        3,188.6 |          436.2 |    7.3× |

## Rendering CPU time

Process user + system CPU time includes runtime worker threads. This helps separate computational cost from scheduling delays on this shared development machine. Preparation is excluded from this table.

| Workload                                    | Old first CPU ms | New first CPU ms | First speedup | Old warm CPU ms | New warm CPU ms | Warm speedup |
| ------------------------------------------- | ---------------: | ---------------: | ------------: | --------------: | --------------: | -----------: |
| Scalar Galaxy 3.1                           |          1,053.0 |            252.4 |          4.2× |           448.0 |            62.1 |         7.2× |
| 10 operations                               |            266.7 |             51.9 |          5.1× |           166.2 |            19.8 |         8.4× |
| 200 operations                              |         10,342.0 |            996.7 |         10.4× |         9,760.1 |           564.3 |        17.3× |
| 100 operations, rich descriptions           |          3,399.2 |            374.6 |          9.1× |         2,716.4 |           224.5 |        12.1× |
| One operation from a 200-operation document |            149.8 |             38.0 |          3.9× |            93.9 |            12.9 |         7.3× |
| 100 separate operation pages                |          4,134.4 |            589.5 |          7.0× |         3,246.9 |           424.6 |         7.6× |

## Elapsed rendering time and peak memory

Warm means the third export through the same renderer. Peak RSS covers the entire worker process, including imports, preparation, and three exports; it is not the memory allocated by one rendering call.

| Workload                                    | Old first ms | New first ms | Old warm ms | New warm ms | Old peak MiB | New peak MiB |
| ------------------------------------------- | -----------: | -----------: | ----------: | ----------: | -----------: | -----------: |
| Scalar Galaxy 3.1                           |        920.3 |        173.2 |       329.3 |        47.6 |        386.7 |        183.6 |
| 10 operations                               |        161.1 |         31.7 |       103.6 |        12.1 |        296.9 |        126.6 |
| 200 operations                              |      9,565.2 |        871.4 |    13,518.8 |       548.8 |      1,204.7 |        393.8 |
| 100 operations, rich descriptions           |      2,290.7 |        304.6 |     2,002.7 |       184.1 |        908.4 |        314.3 |
| One operation from a 200-operation document |         86.0 |         24.9 |        48.8 |         6.2 |        283.6 |        166.0 |
| 100 separate operation pages                |      3,155.1 |        403.3 |     2,454.0 |       327.9 |        507.2 |        376.7 |

## Preparation and output size

The loader is unchanged. Its timing differences reflect sample/runtime variation and are not a claimed loader optimization. Output-size differences are primarily tighter list spacing and Markdown serialization.

| Workload                                    | Old prepare ms | New prepare ms | Old output bytes | New output bytes |
| ------------------------------------------- | -------------: | -------------: | ---------------: | ---------------: |
| Scalar Galaxy 3.1                           |           50.6 |           38.2 |          138,122 |          136,592 |
| 10 operations                               |           10.8 |           10.1 |           32,698 |           32,218 |
| 200 operations                              |          129.2 |           97.0 |        1,598,688 |        1,571,824 |
| 100 operations, rich descriptions           |           33.8 |           34.0 |        1,089,470 |        1,083,242 |
| One operation from a 200-operation document |           56.5 |           70.8 |           12,924 |           12,726 |
| 100 separate operation pages                |           33.5 |           32.9 |          930,580 |          916,780 |

## Interpretation and limits

- The direct AST backend reduced rendering CPU time in every tested workload. Single-operation end-to-end gains are smaller because loading the entire document still costs time.
- Host load varied during the run. Elapsed times are local observations, not production latency promises. CPU time, alternating order, and raw samples provide additional context.
- Network reference-fetch latency and module-import latency were not benchmarked.
- Heading and generated-example counts matched for all six workloads. A separate compatibility test verifies the full Markdown tree against saved legacy output, allowing only list spacing and boundary-whitespace differences.
- Both implementations used the same installed dependencies. Relevant reused compiled Markdown dependencies were verified against their source maps; changed loader/helper sources were rebuilt. See the environment note in the methodology.

## Validation

- 114 tests passed across eight package test files.
- Scoped TypeScript checks (`tsgo` and `tsc`), pure TypeScript build with `tsc-alias`, Biome, Prettier, and isolated package Knip passed.
- Lockfile importer matches the manifest; changeset validation identifies a minor package release.
- Node playground smoke test returned HTTP 200 with 136,592 bytes of Markdown.

[Methodology and reproduction](./README.md) · [Raw samples](./results/comparison.json)
