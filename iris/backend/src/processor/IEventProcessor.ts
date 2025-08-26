import { IrisPacket } from '../models/IrisPacket';

/**
 * Interface for processing parsed IRIS packets.
 */
export interface IEventProcessor {
    /**
     * Process a parsed IRIS packet.
     */
    process(packet: IrisPacket): void;
}
