import WebSocket from 'ws';

export type Callbacks = {
  connected?: () => void;
  disconnected?: (error?: any) => void;
  rejected?: () => void;
  received: (data: any) => void;
};

export class Subscription {
  callbacks: Callbacks;

  constructor(
    query: string,
    identifier: string,
    connectionPromise: Promise<WebSocket>,
    callbacks: Callbacks
  ) {
    this.callbacks = callbacks;

    const send = (connection: WebSocket, command: string, data?: any) => {
      const msg = JSON.stringify({
        identifier,
        command,
        data: JSON.stringify(data),
      });
      connection.send(msg);
    };

    connectionPromise.then((connection: WebSocket) => {
      if (connection.readyState === 1) {
        send(connection, 'subscribe');
        send(connection, 'message', {
          action: 'execute',
          query: `subscription { ${query} }`,
        });
      } else {
        throw new Error('Connection is not opened');
      }
    });
  }
}
