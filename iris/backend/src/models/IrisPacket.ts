/**
 * Parsed IRIS packet with extracted fields.
 */
export interface IrisPacket {
    timestamp: bigint;      // Nanoseconds since boot
    eventType: number;      // Event type identifier
    cpuId: number;         // CPU core ID

    // Future fields (currently in reserved space)
    sequenceNumber?: number;
    flags?: number;

    payload?: Buffer;
}
