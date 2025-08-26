import { IPayloadDecoder } from '../IPayloadDecoder';

/**
 * Decoder for TSS (Task State Segment) loaded events.
 * Interprets raw TSS memory into structured format.
 */
export class TssDecoder implements IPayloadDecoder {
    decode(payload: Buffer): any {
        const tss = {
            rsp0: this.readUInt64LE(payload, 0x04),
            rsp1: this.readUInt64LE(payload, 0x0C),
            rsp2: this.readUInt64LE(payload, 0x14),
            ist: [] as bigint[],
            ioMapBase: 0
        };

        // Read IST entries
        for (let i = 0; i < 7; i++) {
            const offset = 0x24 + (i * 8);
            tss.ist.push(this.readUInt64LE(payload, offset));
        }

        // Read I/O map base if TSS is large enough
        if (payload.length >= 0x68) {
            tss.ioMapBase = payload.readUInt16LE(0x66);
        }

        return {
            rsp0: this.formatAddress(tss.rsp0),
            rsp1: this.formatAddress(tss.rsp1),
            rsp2: this.formatAddress(tss.rsp2),
            ist: tss.ist.map((addr, i) => ({
                index: i + 1,
                address: this.formatAddress(addr),
                configured: addr !== 0n
            })),
            ioMapBase: tss.ioMapBase === 0xFFFF ? 'disabled' : `0x${tss.ioMapBase.toString(16).toUpperCase()}`,
            summary: {
                kernelStackConfigured: tss.rsp0 !== 0n,
                istEntriesConfigured: tss.ist.filter(addr => addr !== 0n).length,
                ioPermissionsEnabled: tss.ioMapBase !== 0xFFFF && tss.ioMapBase !== 0
            }
        };
    }

    getDescription(): string {
        return 'Task State Segment decoder';
    }

    private readUInt64LE(buffer: Buffer, offset: number): bigint {
        if (offset + 8 > buffer.length) {
            return 0n;
        }

        const low = buffer.readUInt32LE(offset);
        const high = buffer.readUInt32LE(offset + 4);
        return (BigInt(high) << 32n) | BigInt(low);
    }

    private formatAddress(addr: bigint): string {
        const hex = addr.toString(16).padStart(16, '0').toUpperCase();
        return `0x${hex}`;
    }
}