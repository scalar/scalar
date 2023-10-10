# Scalar useClipboard()

![Version](https://img.shields.io/npm/v/%40scalar/use-clipboard)
![Downloads](https://img.shields.io/npm/dm/%40scalar/use-clipboard)
![License](https://img.shields.io/npm/l/%40scalar%2Fuse-clipboard)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.com/invite/Ve683JXN)

## Installation

```bash
npm install @scalar/use-clipboard
```

## Usage

```js
import { useClipboard } from '@scalar/use-clipboard'

const { copyToClipboard } = useClipboard()

copyToClipboard(
  'The average distance between the Earth and the Moon is 384 400 km (238 855 miles).',
)
```
