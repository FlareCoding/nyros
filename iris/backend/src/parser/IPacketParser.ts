import { RawPacket } from '../protocol/IPacketDecoder';
import { IrisPacket } from '../models/IrisPacket';

/**
 * Interface for parsing raw packets into structured IRIS packets.
 */
export interface IPacketParser {
    /**
     * Parse a raw packet into an IrisPacket.
     * Returns null if the packet structure is invalid.
     */
    parse(raw: RawPacket): IrisPacket | null;
}
