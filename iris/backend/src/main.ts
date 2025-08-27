#!/usr/bin/env node

import fastify, { FastifyInstance } from 'fastify';
import websocketPlugin from '@fastify/websocket';
import cors from '@fastify/cors';
import { IrisBackend } from './IrisBackend';
import { UnixSocketDataSource } from './transport/UnixSocketDataSource';
import { WebSocketServer } from './server/WebSocketServer';
import { registerAllDecoders } from './decoders/DecoderRegistration';

const SOCKET_PATH = '/tmp/nyros-debug.sock';
const HTTP_PORT = 3001;
const HTTP_HOST = '0.0.0.0';

class IrisApplication {
    private backend?: IrisBackend;
    private server?: FastifyInstance;
    private wsServer?: WebSocketServer;
    private reconnectTimer?: NodeJS.Timeout;
    private readonly RECONNECT_DELAY = 2000; // 2 seconds

    async start(): Promise<void> {
        console.log('=====================================');
        console.log('    IRIS Kernel Inspector v0.1.0    ');
        console.log('=====================================');
        console.log(`[INFO] Socket path: ${SOCKET_PATH}`);
        console.log(`[INFO] WebSocket server: ws://localhost:${HTTP_PORT}/ws`);
        console.log('[INFO] Waiting for kernel connection...\n');

        // Register payload decoders
        registerAllDecoders();

        // Start HTTP/WebSocket server
        await this.startWebServer();

        this.setupProcessHandlers();
        await this.connectWithRetry();
    }

    private async startWebServer(): Promise<void> {
        // Create Fastify server
        this.server = fastify({
            logger: false // We'll use our own logging
        });

        // Register plugins
        await this.server.register(cors, {
            origin: true // Allow all origins for development
        });

        await this.server.register(websocketPlugin);

        // Create WebSocket server handler
        this.wsServer = new WebSocketServer();

        // WebSocket endpoint
        this.server.register(async function (fastify) {
            fastify.get('/ws', { websocket: true }, (connection) => {
                const wsServer = (fastify as any).wsServer as WebSocketServer;
                wsServer.handleConnection(connection);
            });
        });

        // Store wsServer reference for the route handler
        (this.server as any).wsServer = this.wsServer;

        // Health check endpoint
        this.server.get('/health', async () => {
            return {
                status: 'healthy',
                backend: this.backend ? 'connected' : 'disconnected',
                wsClients: this.wsServer?.getClientCount() || 0,
                stats: this.wsServer?.getStats()
            };
        });

        // Start server
        try {
            await this.server.listen({ port: HTTP_PORT, host: HTTP_HOST });
            console.log(`[INFO] HTTP/WebSocket server listening on ${HTTP_HOST}:${HTTP_PORT}`);
        } catch (error) {
            console.error('[ERROR] Failed to start HTTP server:', error);
            throw error;
        }
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

            // Create and start backend with WebSocket server
            this.backend = new IrisBackend(
                dataSource,
                undefined, // Use default decoder
                undefined, // Use default parser
                undefined, // Use default processor
                this.wsServer // Pass WebSocket server for broadcasting
            );
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

    private async shutdown(): Promise<void> {
        // Clear reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }

        // Stop backend (which will also shutdown WebSocket)
        if (this.backend) {
            this.backend.stop();
        }

        // Close HTTP/WebSocket server
        if (this.server) {
            try {
                await this.server.close();
                console.log('[INFO] HTTP/WebSocket server closed');
            } catch (error) {
                console.error('[ERROR] Failed to close server:', error);
            }
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