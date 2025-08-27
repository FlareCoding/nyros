import { IDataSource } from './transport/IDataSource';
import { IPacketDecoder } from './protocol/IPacketDecoder';
import { IPacketParser } from './parser/IPacketParser';
import { IEventProcessor } from './processor/IEventProcessor';
import { BinaryPacketDecoder } from './protocol/BinaryPacketDecoder';
import { IrisPacketParser } from './parser/IrisPacketParser';
import { DefaultEventProcessor } from './processor/DefaultEventProcessor';
import { WebSocketServer } from './server/WebSocketServer';

/**
 * Main IRIS backend orchestrator.
 * Wires together all components and manages the data flow pipeline.
 */
export class IrisBackend {
    private dataSource: IDataSource;
    private decoder: IPacketDecoder;
    private parser: IPacketParser;
    private processor: IEventProcessor;
    private wsServer?: WebSocketServer;
    private hasReceivedInit = false;

    constructor(
        dataSource: IDataSource,
        decoder: IPacketDecoder = new BinaryPacketDecoder(),
        parser: IPacketParser = new IrisPacketParser(),
        processor: IEventProcessor = new DefaultEventProcessor(),
        wsServer?: WebSocketServer
    ) {
        this.dataSource = dataSource;
        this.decoder = decoder;
        this.parser = parser;
        this.processor = processor;
        this.wsServer = wsServer;

        this.wireComponents();
    }

    /**
     * Wire together all components in the processing pipeline.
     */
    private wireComponents(): void {
        // Data source → Decoder
        this.dataSource.onData((data) => {
            this.decoder.write(data);
        });

        // Decoder → Parser → Processor → WebSocket
        this.decoder.onPacket((rawPacket) => {
            const packet = this.parser.parse(rawPacket);
            if (packet) {
                // Check for IRIS_INIT event (0x0001)
                if (packet.eventType === 0x0001) {
                    this.hasReceivedInit = true;
                    console.log('[IRIS] Kernel connection established');
                }

                // Process to console
                this.processor.process(packet);

                // Broadcast to WebSocket clients if server is available
                if (this.wsServer) {
                    this.wsServer.broadcast(packet);
                }
            }
        });

        // Handle corrupted data
        this.decoder.onCorrupted((data, reason) => {
            if (!this.hasReceivedInit) {
                return;
            }

            console.warn(`[IRIS] Corrupted data detected: ${reason} (${data.length} bytes discarded)`);
        });

        // Handle connection errors
        this.dataSource.onError((error) => {
            console.error('[IRIS] Data source error:', error.message);
        });

        // Handle connection close
        this.dataSource.onClose(() => {
            if (this.hasReceivedInit) {
                console.log('[IRIS] Connection lost');
            }
            this.hasReceivedInit = false;  // Reset init flag on disconnect
        });
    }

    /**
 * Start the IRIS backend.
 */
    async start(): Promise<void> {
        await this.dataSource.connect();
    }

    /**
     * Stop the IRIS backend.
     */
    stop(): void {
        console.log('[IRIS] Stopping backend...');

        // Shutdown WebSocket server if present
        if (this.wsServer) {
            this.wsServer.shutdown();
        }

        this.dataSource.disconnect();
    }
}
