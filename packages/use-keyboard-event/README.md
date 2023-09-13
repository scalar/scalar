# Scalar useKeyboardEvent()

![Version](https://img.shields.io/npm/v/%40scalar/use-keyboard-event)
![Downloads](https://img.shields.io/npm/dm/%40scalar/use-keyboard-event)
![License](https://img.shields.io/npm/l/%40scalar%2Fuse-keyboard-event)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/mw6FQRPh)

## Installation

```bash
npm install @scalar/use-keyboard-event
```

## Usage

```js
import { useKeyboardEvent } from '@scalar/use-keyboard-event'

// Control/Cmd + K
useKeyboardEvent({
  keyList: ['k'],
  withCtrlCmd: true,
  handler: () => { … },
})
```