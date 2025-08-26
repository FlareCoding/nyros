/**
 * Interface for decoding binary payloads from IRIS events.
 * Each event type can have its own decoder implementation.
 */
export interface IPayloadDecoder {
    /**
     * Decode binary payload into a JavaScript object.
     * @param payload Raw binary data from kernel
     * @returns Decoded object with interpreted fields
     */
    decode(payload: Buffer): any;

    /**
     * Get human-readable description of what this decoder handles.
     */
    getDescription(): string;
}
