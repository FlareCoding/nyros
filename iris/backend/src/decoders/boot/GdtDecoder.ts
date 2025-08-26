import { IPayloadDecoder } from '../IPayloadDecoder';

/**
 * Decoder for GDT (Global Descriptor Table) loaded events.
 * Interprets raw GDT memory into structured format.
 */
export class GdtDecoder implements IPayloadDecoder {
    decode(payload: Buffer): any {
        const entries = [];
        const entryCount = payload.length / 8;

        for (let i = 0; i < entryCount; i++) {
            const offset = i * 8;
            const entry = this.decodeGdtEntry(payload.slice(offset, offset + 8), i);
            entries.push(entry);
        }

        return {
            entryCount,
            entries,
            codeSegmentSelector: this.findCodeSegment(entries),
            dataSegmentSelector: this.findDataSegment(entries),
            tssSelector: this.findTssSegment(entries)
        };
    }

    getDescription(): string {
        return 'Global Descriptor Table decoder';
    }

    private decodeGdtEntry(data: Buffer, index: number): any {
        const limitLow = data.readUInt16LE(0);
        const baseLow = data.readUInt16LE(2);
        const baseMid = data.readUInt8(4);
        const access = data.readUInt8(5);
        const granularity = data.readUInt8(6);
        const baseHigh = data.readUInt8(7);

        const base = baseLow | (baseMid << 16) | (baseHigh << 24);
        const limitHigh = granularity & 0x0F;
        let limit = limitLow | (limitHigh << 16);

        const type = access & 0x0F;
        const system = ((access >> 4) & 0x1) === 0;
        const dpl = (access >> 5) & 0x3;
        const present = ((access >> 7) & 0x1) === 1;

        const gran = ((granularity >> 7) & 0x1) === 1;
        const db = ((granularity >> 6) & 0x1) === 1;
        const longMode = ((granularity >> 5) & 0x1) === 1;

        if (gran) {
            limit = (limit << 12) | 0xFFF;
        }

        return {
            index,
            base: `0x${base.toString(16).padStart(8, '0')}`,
            limit: `0x${limit.toString(16).padStart(8, '0')}`,
            type: `0x${type.toString(16)}`,
            system,
            dpl,
            present,
            longMode,
            db,
            granularity: gran
        };
    }

    private findCodeSegment(entries: any[]): string | null {
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (!entry.system && entry.present && (parseInt(entry.type) & 0x8)) {
                return `0x${(i * 8).toString(16).padStart(2, '0')}`;
            }
        }
        return null;
    }

    private findDataSegment(entries: any[]): string | null {
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (!entry.system && entry.present && !(parseInt(entry.type) & 0x8)) {
                return `0x${(i * 8).toString(16).padStart(2, '0')}`;
            }
        }
        return null;
    }

    private findTssSegment(entries: any[]): string | null {
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const typeNum = parseInt(entry.type);
            if (entry.system && entry.present && (typeNum === 0x9 || typeNum === 0xB)) {
                return `0x${(i * 8).toString(16).padStart(2, '0')}`;
            }
        }
        return null;
    }
}