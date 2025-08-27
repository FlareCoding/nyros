import { IEventProcessor } from './IEventProcessor';
import { IrisPacket } from '../models/IrisPacket';

/**
 * Default event processor that counts events without logging details.
 * Events are streamed to WebSocket clients for display.
 */
export class DefaultEventProcessor implements IEventProcessor {
    private eventCount = 0;
    private lastLogTime = Date.now();
    private readonly LOG_INTERVAL = 5000; // Log stats every 5 seconds

    process(packet: IrisPacket): void {
        this.eventCount++;

        // Only log a status update periodically to avoid cluttering console
        const now = Date.now();
        if (now - this.lastLogTime >= this.LOG_INTERVAL) {
            console.log(`[IRIS] Processed ${this.eventCount} events`);
            this.lastLogTime = now;
        }
    }
}