#!/usr/bin/env node

import { KernelSocketClient } from './socket/KernelSocketClient';

const SOCKET_PATH = '/tmp/nyros-debug.sock';

class IrisBackend {
    private kernelClient: KernelSocketClient;

    constructor() {
        this.kernelClient = new KernelSocketClient(SOCKET_PATH);
    }

    async start(): Promise<void> {
        console.log('IRIS Backend - Socket Reader');
        console.log('============================');
        console.log('[INFO] Starting socket reader...');

        this.setupProcessHandlers();

        try {
            await this.kernelClient.connect();
        } catch (error) {
            console.error('[ERROR] Failed to start:', error);
            process.exit(1);
        }
    }

    private setupProcessHandlers(): void {
        process.on('SIGINT', () => {
            console.log('\n[INFO] Shutting down gracefully');
            this.kernelClient.disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n[INFO] Received SIGTERM, shutting down');
            this.kernelClient.disconnect();
            process.exit(0);
        });

        process.on('uncaughtException', (error) => {
            console.error('[ERROR] Uncaught exception:', error);
            this.kernelClient.disconnect();
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('[ERROR] Unhandled rejection at:', promise, 'reason:', reason);
            this.kernelClient.disconnect();
            process.exit(1);
        });
    }
}

async function main(): Promise<void> {
    const app = new IrisBackend();
    await app.start();
}

// Entry point
if (require.main === module) {
    main().catch((error) => {
        console.error('[ERROR] Application failed to start:', error);
        process.exit(1);
    });
}
