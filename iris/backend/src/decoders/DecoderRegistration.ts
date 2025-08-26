import { decoderRegistry } from './DecoderRegistry';
import { GdtDecoder } from './boot/GdtDecoder';
import { TssDecoder } from './boot/TssDecoder';

// Event type constants (must match kernel)
const EVENT_GDT_LOADED = 0x0101;
const EVENT_TSS_LOADED = 0x0102;

/**
 * Register all payload decoders with the registry.
 * This should be called during application initialization.
 */
export function registerAllDecoders(): void {
    // Boot event decoders
    decoderRegistry.register(EVENT_GDT_LOADED, new GdtDecoder());
    decoderRegistry.register(EVENT_TSS_LOADED, new TssDecoder());
}
