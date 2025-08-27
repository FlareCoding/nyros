import { WebSocket } from 'ws';
import { IrisPacket } from '../models/IrisPacket';

/**
 * WebSocket server for streaming IRIS events to connected clients.
 * Handles multiple client connections and broadcasts events to all.
 */
export class WebSocketServer {
    private clients: Set<WebSocket> = new Set();
    private clientId = 0;
    private stats = {
        totalConnections: 0,
        activeConnections: 0,
        totalEventsBroadcast: 0,
        totalBytesSent: 0
    };

    constructor() {
        // Periodically clean up disconnected clients
        setInterval(() => this.cleanupDisconnectedClients(), 30000);
    }

    /**
     * Broadcast an IRIS packet to all connected clients
     */
    broadcast(packet: IrisPacket): void {
        if (this.clients.size === 0) {
            return; // No clients, skip serialization
        }

        // Convert BigInt to number for JSON serialization
        const serializable = {
            ...packet,
            timestamp: typeof packet.timestamp === 'bigint'
                ? Number(packet.timestamp)
                : packet.timestamp
        };

        const message = JSON.stringify({
            type: 'event',
            data: serializable
        });

        const messageBuffer = Buffer.from(message);
        const deadClients: WebSocket[] = [];

        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(messageBuffer);
                    this.stats.totalBytesSent += messageBuffer.length;
                } catch (error) {
                    console.error('[WebSocket] Failed to send to client:', error);
                    deadClients.push(client);
                }
            } else if (client.readyState !== WebSocket.CONNECTING) {
                deadClients.push(client);
            }
        }

        // Clean up dead clients
        for (const client of deadClients) {
            this.removeClient(client);
        }

        this.stats.totalEventsBroadcast++;
    }

    /**
     * Batch broadcast multiple packets (for efficiency)
     */
    broadcastBatch(packets: IrisPacket[]): void {
        if (this.clients.size === 0 || packets.length === 0) {
            return;
        }

        // Convert BigInt timestamps for JSON serialization
        const serializable = packets.map(packet => ({
            ...packet,
            timestamp: typeof packet.timestamp === 'bigint'
                ? Number(packet.timestamp)
                : packet.timestamp
        }));

        const message = JSON.stringify({
            type: 'batch',
            data: serializable
        });

        const messageBuffer = Buffer.from(message);
        const deadClients: WebSocket[] = [];

        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(messageBuffer);
                    this.stats.totalBytesSent += messageBuffer.length;
                } catch (error) {
                    console.error('[WebSocket] Failed to send batch to client:', error);
                    deadClients.push(client);
                }
            }
        }

        for (const client of deadClients) {
            this.removeClient(client);
        }

        this.stats.totalEventsBroadcast += packets.length;
    }

    /**
     * Handle a new WebSocket connection
     */
    handleConnection(socket: WebSocket): void {
        const id = ++this.clientId;

        console.log(`[WebSocket] Client #${id} connected`);

        this.clients.add(socket);
        this.stats.totalConnections++;
        this.stats.activeConnections = this.clients.size;

        // Send welcome message with connection info
        socket.send(JSON.stringify({
            type: 'welcome',
            data: {
                clientId: id,
                serverTime: Date.now(),
                stats: this.getStats()
            }
        }));

        // Handle client messages (for future filtering/commands)
        socket.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleClientMessage(socket, message);
            } catch (error) {
                console.error(`[WebSocket] Invalid message from client #${id}:`, error);
            }
        });

        // Handle disconnection
        socket.on('close', () => {
            console.log(`[WebSocket] Client #${id} disconnected`);
            this.removeClient(socket);
        });

        socket.on('error', (error) => {
            console.error(`[WebSocket] Client #${id} error:`, error);
            this.removeClient(socket);
        });

        // Send periodic ping to keep connection alive
        const pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.ping();
            } else {
                clearInterval(pingInterval);
            }
        }, 30000);
    }

    /**
     * Handle messages from clients (for future features)
     */
    private handleClientMessage(socket: WebSocket, message: any): void {
        switch (message.type) {
            case 'ping':
                socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'subscribe':
                // Future: Implement filtered subscriptions
                console.log('[WebSocket] Client subscription request:', message.filters);
                break;
            case 'getStats':
                socket.send(JSON.stringify({
                    type: 'stats',
                    data: this.getStats()
                }));
                break;
            default:
                console.warn('[WebSocket] Unknown message type:', message.type);
        }
    }

    /**
     * Remove a client from the active set
     */
    private removeClient(socket: WebSocket): void {
        this.clients.delete(socket);
        this.stats.activeConnections = this.clients.size;

        // Clean up any resources
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            try {
                socket.close();
            } catch (error) {
                // Socket already closed
            }
        }
    }

    /**
     * Clean up disconnected clients
     */
    private cleanupDisconnectedClients(): void {
        const deadClients: WebSocket[] = [];

        for (const client of this.clients) {
            if (client.readyState === WebSocket.CLOSED ||
                client.readyState === WebSocket.CLOSING) {
                deadClients.push(client);
            }
        }

        for (const client of deadClients) {
            this.removeClient(client);
        }

        if (deadClients.length > 0) {
            console.log(`[WebSocket] Cleaned up ${deadClients.length} disconnected clients`);
        }
    }

    /**
     * Get server statistics
     */
    getStats() {
        return {
            ...this.stats,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }

    /**
     * Get the number of connected clients
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Shutdown the server gracefully
     */
    shutdown(): void {
        console.log('[WebSocket] Shutting down server...');

        // Send goodbye message to all clients
        const message = JSON.stringify({
            type: 'shutdown',
            reason: 'Server shutting down'
        });

        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
                client.close(1001, 'Server shutdown');
            }
        }

        this.clients.clear();
        this.stats.activeConnections = 0;
    }
}
