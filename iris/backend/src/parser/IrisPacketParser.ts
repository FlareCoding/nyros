import { IPacketParser } from './IPacketParser';
import { RawPacket } from '../protocol/IPacketDecoder';
import { IrisPacket } from '../models/IrisPacket';

/**
 * Parser for IRIS binary protocol packets.
 * Validates structure and extracts fields from raw packet data.
 */
export class IrisPacketParser implements IPacketParser {
    private readonly EXPECTED_HEADER_SIZE = 18; // Reserved(2) + Timestamp(8) + EventType(2) + CpuId(1) + Reserved(5)

    parse(raw: RawPacket): IrisPacket | null {
        // Validate packet structure
        if (!this.validateStructure(raw.data)) {
            return null;
        }

        try {
            // Extract fields from binary data
            // Note: First 2 bytes are reserved (padding after length)
            const timestamp = raw.data.readBigUInt64LE(2);
            const eventType = raw.data.readUInt16LE(10);
            const cpuId = raw.data.readUInt8(12);

            // Reserved bytes at offset 13-17 (5 bytes)
            // Future: could extract sequence number, flags, etc. from here

            const packet: IrisPacket = {
                timestamp: timestamp,
                eventType: eventType,
                cpuId: cpuId
            };

            // If there's payload data beyond the header
            if (raw.data.length > this.EXPECTED_HEADER_SIZE) {
                packet.payload = raw.data.slice(this.EXPECTED_HEADER_SIZE);
            }

            return packet;
        } catch (error) {
            console.error('[IrisPacketParser] Failed to parse packet:', error);
            return null;
        }
    }

    private validateStructure(data: Buffer): boolean {
        // Must have at least the minimum header size
        if (data.length < this.EXPECTED_HEADER_SIZE) {
            return false;
        }

        // Future: Additional validation
        // - Check reserved fields are zero
        // - Validate event type is in known range
        // - Check CPU ID is reasonable

        return true;
    }
}
