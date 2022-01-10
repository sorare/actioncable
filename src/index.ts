import WebSocket from 'ws';
import { StringDecoder } from 'string_decoder';

import { Subscription, Callbacks } from './subscription';

export type Options = {
  url?: string;
  origin?: string;
  headers?: Record<string, string>;
};

enum MessageType {
  Welcome = 'welcome',
  Ping = 'ping',
  Confirmation = 'confirm_subscription',
  Rejection = 'reject_subscription',
  Disconnect = 'disconnect',
}

export class ActionCable {
  private url: string;

  private origin?: string;

  private headers: Record<string, string>;

  private connection?: WebSocket;

  private connectionPromise: Promise<WebSocket>;

  private subscriptions: Record<string, Subscription>;

  private lastHeartbeatTimestamp: number;

  private heartbeatInterval?: NodeJS.Timer;

  constructor(options: Options) {
    // options
    this.url = options.url || 'wss://ws.sorare.com/cable';
    this.origin = options.origin;
    this.headers = options.headers || {};

    // heartbeat state
    this.lastHeartbeatTimestamp = 0;
    this.heartbeatInterval = undefined;

    // web socket
    this.connection = undefined;
    this.subscriptions = {};
    this.connectionPromise = this.connect();
  }

  subscribe(query: string, callbacks: Callbacks): Subscription {
    const identifier = JSON.stringify({
      channel: 'GraphqlChannel',
      channelId: Math.random().toString(36).substring(2, 8),
    });

    if (this.subscriptions[identifier]) {
      throw new Error('Already subscribed to this event.');
    }

    this.subscriptions[identifier] = new Subscription(
      query,
      identifier,
      this.connectionPromise,
      callbacks
    );
    return this.subscriptions[identifier];
  }

  private connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const connection = new WebSocket(this.url, undefined, {
        origin: this.origin,
        headers: this.headers,
      });

      connection.on('error', (err) => {
        this.disconnect(err);
        reject(err);
      });
      connection.on('close', () => this.disconnect('closed'));
      connection.on('message', (msg: WebSocket.RawData) => {
        const decoder = new StringDecoder('utf8');
        const data = JSON.parse(decoder.write(msg as Buffer));
        this.handleMessage(data);
      });
      connection.on('open', () => {
        this.heartbeatInterval = setInterval(
          () => this.checkHeartbeat(),
          10000
        );
        resolve(connection);
      });

      this.connection = connection;
    });
  }

  private disconnect(err?: any): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    Object.entries(this.subscriptions).forEach(([query, subscription]) => {
      subscription.callbacks.disconnected?.(err);
      delete this.subscriptions[query];
    });
  }

  private handleMessage(data: any) {
    const sub = this.subscriptions[data.identifier];
    const type = data.type as MessageType;

    switch (type) {
      case MessageType.Welcome:
        break;
      case MessageType.Ping:
        this.lastHeartbeatTimestamp = +new Date();
        break;
      case MessageType.Confirmation:
        sub.callbacks.connected?.();
        break;
      case MessageType.Rejection:
        sub.callbacks.rejected?.();
        break;
      case MessageType.Disconnect:
        this.disconnect(data.reason);
        break;
      default:
        sub.callbacks.received(data.message);
        break;
    }
  }

  private checkHeartbeat() {
    if (!this.connection || !this.lastHeartbeatTimestamp) {
      return;
    }

    const isFlat = this.lastHeartbeatTimestamp + 10 * 1000 < +new Date();
    if (isFlat) {
      this.connection.close();
    }
  }
}
