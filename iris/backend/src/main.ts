#!/usr/bin/env node

import { IrisBackend } from './IrisBackend';
import { UnixSocketDataSource } from './transport/UnixSocketDataSource';

const SOCKET_PATH = '/tmp/nyros-debug.sock';

class IrisApplication {
    private backend?: IrisBackend;
    private reconnectTimer?: NodeJS.Timeout;
    private readonly RECONNECT_DELAY = 2000; // 2 seconds

    async start(): Promise<void> {
        console.log('=====================================');
        console.log('    IRIS Kernel Inspector v0.1.0    ');
        console.log('=====================================');
        console.log(`[INFO] Socket path: ${SOCKET_PATH}`);
        console.log('[INFO] Waiting for kernel connection...\n');

        this.setupProcessHandlers();
        await this.connectWithRetry();
    }

    private async connectWithRetry(): Promise<void> {
        try {
            // Create data source
            const dataSource = new UnixSocketDataSource(SOCKET_PATH);

            // Set up reconnection on close
            dataSource.onClose(() => {
                // Silent reconnection attempt
                this.scheduleReconnect();
            });

            // Create and start backend with the data source
            this.backend = new IrisBackend(dataSource);
            await this.backend.start();

        } catch (error) {
            // Silent retry for socket not found
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect(): void {
        // Clear any existing timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        // Schedule reconnection attempt
        this.reconnectTimer = setTimeout(() => {
            this.connectWithRetry();
        }, this.RECONNECT_DELAY);
    }

    private setupProcessHandlers(): void {
        // Graceful shutdown on SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            console.log('\n[INFO] Received SIGINT, shutting down gracefully...');
            this.shutdown();
        });

        // Graceful shutdown on SIGTERM
        process.on('SIGTERM', () => {
            console.log('\n[INFO] Received SIGTERM, shutting down...');
            this.shutdown();
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('[ERROR] Uncaught exception:', error);
            this.shutdown();
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('[ERROR] Unhandled rejection at:', promise, 'reason:', reason);
            this.shutdown();
        });
    }

    private shutdown(): void {
        // Clear reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }

        // Stop backend
        if (this.backend) {
            this.backend.stop();
        }

        console.log('[INFO] IRIS backend stopped');
        process.exit(0);
    }
}

// Entry point
async function main(): Promise<void> {
    const app = new IrisApplication();
    await app.start();
}

if (require.main === module) {
    main().catch((error) => {
        console.error('[ERROR] Application failed to start:', error);
        process.exit(1);
    });
}

export { IrisApplication };