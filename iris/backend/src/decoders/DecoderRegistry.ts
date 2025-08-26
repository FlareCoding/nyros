import { IPayloadDecoder } from './IPayloadDecoder';

/**
 * Registry for payload decoders.
 * Maps event types to their specific decoder implementations.
 */
export class DecoderRegistry {
    private static instance: DecoderRegistry;
    private decoders = new Map<number, IPayloadDecoder>();

    private constructor() { }

    static getInstance(): DecoderRegistry {
        if (!DecoderRegistry.instance) {
            DecoderRegistry.instance = new DecoderRegistry();
        }
        return DecoderRegistry.instance;
    }

    /**
     * Register a decoder for a specific event type.
     */
    register(eventType: number, decoder: IPayloadDecoder): void {
        this.decoders.set(eventType, decoder);
    }

    /**
     * Decode a payload for a specific event type.
     * Returns undefined if no decoder is registered.
     */
    decode(eventType: number, payload: Buffer): any {
        const decoder = this.decoders.get(eventType);
        if (!decoder) {
            return undefined;
        }

        try {
            return decoder.decode(payload);
        } catch (error) {
            console.error(`[DecoderRegistry] Failed to decode event 0x${eventType.toString(16)}:`, error);
            return undefined;
        }
    }

    /**
     * Check if a decoder exists for an event type.
     */
    hasDecoder(eventType: number): boolean {
        return this.decoders.has(eventType);
    }
}

// Export singleton instance
export const decoderRegistry = DecoderRegistry.getInstance();
