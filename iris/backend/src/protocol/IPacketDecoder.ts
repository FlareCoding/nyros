/**
 * Represents a raw packet extracted from the binary stream.
 */
export interface RawPacket {
    magic: number;
    length: number;
    data: Buffer;  // Contains header + payload after length field
}

/**
 * Interface for decoding binary data stream into packets.
 * Handles framing, magic byte detection, and packet extraction.
 */
export interface IPacketDecoder {
    /**
     * Register a handler for successfully decoded packets.
     */
    onPacket(handler: (packet: RawPacket) => void): void;

    /**
     * Register a handler for corrupted data detection.
     */
    onCorrupted(handler: (data: Buffer, reason: string) => void): void;

    /**
     * Write raw binary data to the decoder.
     * The decoder will accumulate data and emit packets when complete.
     */
    write(data: Buffer): void;
}
