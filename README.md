<p align="center">
  <img src="logo.png">
</p>

<h4 align='center'>JavaScript WebSocket Client for Sorare</h4>

<p align="center">
  <a href="https://www.typescriptlang.org/">
    <img src='https://badges.aleen42.com/src/typescript.svg' />
  </a>
  <a href="https://www.npmjs.com/package/@sorare/actioncable">
    <img src='https://img.shields.io/github/package-json/v/@sorare/actioncable?label=npm' />
  </a>
  <a href="https://github.com/sorare/actioncable/actions/workflows/node.js.yml">
    <img src='https://github.com/sorare/actioncable/actions/workflows/node.js.yml/badge.svg' />
  </a>
</p>

# @sorare/actioncable

WebSocket/ActionCable client for Sorare.

## Getting Started

`npm install @sorare/actioncable --save`

```javascript
const { ActionCable } = require('@sorare/actioncable');

const cable = new ActionCable({
  url: 'wss://ws.sorare.com/cable',
  headers: {
    // 'Authorization': `Bearer <YourJWTorOAuthToken>`,
    // 'APIKEY': '<YourOptionalAPIKey>'
  },
});

cable.subscribe('aCardWasUpdated { id }', {
  connected() {
    console.log('connected');
  },

  disconnected() {
    console.log('disconnected');
  },

  rejected() {
    console.log('rejected');
  },

  received(data) {
    console.log('received');
    console.log(data);
  },
});
```

# License

`@sorare/actioncable` is [MIT licensed](LICENSE). Credits to [ZackMattor/actioncable-nodejs](https://github.com/ZackMattor/actioncable-nodejs) for the initial work.
