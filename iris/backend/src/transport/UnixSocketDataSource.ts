import * as net from 'net';
import { IDataSource } from './IDataSource';

/**
 * Unix domain socket implementation of IDataSource.
 * Handles connection, reconnection, and data streaming from a Unix socket.
 */
export class UnixSocketDataSource implements IDataSource {
    private socket?: net.Socket;
    private connected = false;
    private dataHandler?: (data: Buffer) => void;
    private errorHandler?: (error: Error) => void;
    private closeHandler?: () => void;

    constructor(private readonly socketPath: string) { }

    onData(handler: (data: Buffer) => void): void {
        this.dataHandler = handler;
    }

    onError(handler: (error: Error) => void): void {
        this.errorHandler = handler;
    }

    onClose(handler: () => void): void {
        this.closeHandler = handler;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = net.createConnection(this.socketPath);

            this.socket.once('connect', () => {
                this.connected = true;
                this.setupSocketHandlers();
                resolve();
            });

            this.socket.once('error', (error) => {
                this.connected = false;
                reject(error);
            });
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.destroy();
            this.socket = undefined;
            this.connected = false;
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    private setupSocketHandlers(): void {
        if (!this.socket) return;

        this.socket.on('data', (data: Buffer) => {
            if (this.dataHandler) {
                this.dataHandler(data);
            }
        });

        this.socket.on('error', (error) => {
            this.connected = false;
            if (this.errorHandler) {
                this.errorHandler(error);
            }
        });

        this.socket.on('close', () => {
            this.connected = false;
            if (this.closeHandler) {
                this.closeHandler();
            }
        });

        this.socket.on('end', () => {
            this.connected = false;
            if (this.closeHandler) {
                this.closeHandler();
            }
        });
    }
}
