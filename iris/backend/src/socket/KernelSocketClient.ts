import * as net from 'net';

/**
 * Client for connecting to kernel debug output via Unix domain socket.
 * Handles automatic reconnection and line buffering.
 */
export class KernelSocketClient {
    private socket?: net.Socket;
    private isConnected = false;
    private hasEverConnected = false;
    private reconnectTimeout?: NodeJS.Timeout;

    private dataBuffer = Buffer.alloc(0); // Buffer for incomplete data
    private readonly reconnectDelay = {
        initial: 1000,
        afterConnection: 2000
    };

    constructor(private readonly socketPath: string) { }

    async connect(): Promise<void> {
        this.clearReconnectTimeout();

        this.socket = net.createConnection(this.socketPath);
        this.setupSocketEventHandlers();
    }

    disconnect(): void {
        this.clearReconnectTimeout();

        if (this.socket) {
            console.log('[INFO] Disconnecting from socket');
            this.socket.destroy();
            this.isConnected = false;
        }

        this.dataBuffer = Buffer.alloc(0);
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }

    private clearReconnectTimeout(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = undefined;
        }
    }

    private setupSocketEventHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            if (!this.hasEverConnected) {
                console.log('[INFO] Connected to kernel debug socket');
                this.hasEverConnected = true;
            }
            this.isConnected = true;
        });

        this.socket.on('data', (data: Buffer) => {
            this.processIncomingData(data);
        });

        this.socket.on('error', (error) => {
            this.handleSocketError(error);
        });

        this.socket.on('close', () => {
            this.isConnected = false;
            this.scheduleReconnect();
        });

        this.socket.on('end', () => {
            this.isConnected = false;
            this.scheduleReconnect();
        });
    }

    private handleSocketError(error: Error): void {
        // Only log errors if we've connected before, or if
        // it's not the common "socket doesn't exist" error.
        const isSocketNotFound = error.message === `connect ENOENT ${this.socketPath}`;

        if (this.hasEverConnected || !isSocketNotFound) {
            console.error(`[ERROR] Socket error: ${error.message}`);
        }

        this.isConnected = false;
        this.scheduleReconnect();
    }

    private processIncomingData(data: Buffer): void {
        this.dataBuffer = Buffer.concat([this.dataBuffer, data]);

        // Process complete lines ending with \n\r
        let lineEndIndex: number;
        while ((lineEndIndex = this.dataBuffer.indexOf('\n\r')) !== -1) {
            const lineBuffer = this.dataBuffer.subarray(0, lineEndIndex + 2);
            this.dataBuffer = this.dataBuffer.subarray(lineEndIndex + 2);

            const lineString = lineBuffer.toString();
            console.log(`[DATA] ${JSON.stringify(lineString)}`);
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimeout) {
            return; // Already scheduled
        }

        const delay = this.hasEverConnected
            ? this.reconnectDelay.afterConnection
            : this.reconnectDelay.initial;

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = undefined;
            this.connect();
        }, delay);
    }
}
