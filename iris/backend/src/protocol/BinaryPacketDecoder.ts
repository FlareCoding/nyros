import { IPacketDecoder, RawPacket } from './IPacketDecoder';

/**
 * Binary protocol decoder for IRIS packets.
 * Handles packet framing, synchronization, and extraction.
 */
export class BinaryPacketDecoder implements IPacketDecoder {
    private buffer = Buffer.alloc(0);
    private readonly MAGIC = 0x53495249; // 'IRIS' in little-endian
    private readonly MIN_PACKET_SIZE = 24; // Magic(4) + Length(2) + Reserved(2) + Header(16)

    private packetHandler?: (packet: RawPacket) => void;
    private corruptedHandler?: (data: Buffer, reason: string) => void;

    onPacket(handler: (packet: RawPacket) => void): void {
        this.packetHandler = handler;
    }

    onCorrupted(handler: (data: Buffer, reason: string) => void): void {
        this.corruptedHandler = handler;
    }

    write(data: Buffer): void {
        // Accumulate incoming data
        this.buffer = Buffer.concat([this.buffer, data]);

        // Process buffer for complete packets
        this.processBuffer();
    }

    private processBuffer(): void {
        while (this.buffer.length >= this.MIN_PACKET_SIZE) {
            // Look for magic bytes at the start
            const magic = this.buffer.readUInt32LE(0);

            if (magic !== this.MAGIC) {
                // Magic not found at start, try to resync
                this.handleCorruptedData();
                continue;
            }

            // Read packet length (bytes after length field)
            const length = this.buffer.readUInt16LE(4);
            const totalPacketSize = 6 + length; // Magic(4) + Length(2) + remaining data

            // Check if we have the complete packet
            if (this.buffer.length < totalPacketSize) {
                // Wait for more data
                break;
            }

            // Extract the complete packet
            const packetData = this.buffer.slice(6, totalPacketSize);

            // Emit the packet
            if (this.packetHandler) {
                const packet: RawPacket = {
                    magic: magic,
                    length: length,
                    data: packetData
                };
                this.packetHandler(packet);
            }

            // Remove processed packet from buffer
            this.buffer = this.buffer.slice(totalPacketSize);
        }
    }

    private handleCorruptedData(): void {
        // Try to find the next magic byte sequence
        const syncIndex = this.findNextSync();

        if (syncIndex === -1) {
            // No magic found, keep last 3 bytes (might be partial magic)
            const corruptedData = this.buffer.slice(0, Math.max(0, this.buffer.length - 3));

            if (corruptedData.length > 0 && this.corruptedHandler) {
                this.corruptedHandler(corruptedData, 'No magic bytes found');
            }

            this.buffer = this.buffer.slice(-Math.min(3, this.buffer.length));
        } else {
            // Found magic at syncIndex, skip corrupted bytes
            const corruptedData = this.buffer.slice(0, syncIndex);

            if (corruptedData.length > 0 && this.corruptedHandler) {
                this.corruptedHandler(corruptedData, 'Skipped to next magic');
            }

            this.buffer = this.buffer.slice(syncIndex);
        }
    }

    private findNextSync(): number {
        // Search for magic bytes starting from position 1
        for (let i = 1; i <= this.buffer.length - 4; i++) {
            const magic = this.buffer.readUInt32LE(i);
            if (magic === this.MAGIC) {
                return i;
            }
        }
        return -1;
    }
}
