import { IEventProcessor } from './IEventProcessor';
import { IrisPacket } from '../models/IrisPacket';
import { eventRegistry, EventCategory, EventSeverity } from '../models/EventRegistry';
import { Colors, colorize } from '../utils/colors';

/**
 * Event processor that logs packets to console.
 * Formats and displays IRIS events for debugging.
 */
export class ConsoleEventProcessor implements IEventProcessor {
    private eventCount = 0;

    process(packet: IrisPacket): void {
        this.eventCount++;

        const timestamp = this.formatTimestamp(packet.timestamp);
        const eventInfo = this.formatEventInfo(packet.eventType);
        const cpuInfo = colorize(`CPU${packet.cpuId}`, Colors.cyan);
        const counter = colorize(`#${this.eventCount}`, Colors.dim);

        console.log(
            `[IRIS] ${counter} | ${timestamp} | ${cpuInfo} | ${eventInfo}` +
            (packet.payload ? colorize(` | ${packet.payload.length} bytes payload`, Colors.dim) : '')
        );
    }

    private formatTimestamp(nanos: bigint): string {
        // Convert nanoseconds to milliseconds with 3 decimal places
        const millis = Number(nanos / 1000000n);
        const seconds = millis / 1000;

        if (nanos === 0n) {
            return '0.000s';
        }

        return `${seconds.toFixed(3)}s`;
    }

    private formatEventInfo(type: number): string {
        const event = eventRegistry.lookup(type);

        if (event) {
            const categoryColor = this.getCategoryColor(event.category);
            const severityColor = this.getSeverityColor(event.severity);

            // Format: CATEGORY::NAME (0xID)
            const category = colorize(event.category, categoryColor);
            const name = colorize(event.name, severityColor);
            const hexId = colorize(`0x${type.toString(16).padStart(4, '0')}`, Colors.dim);

            return `${category}::${name} (${hexId})`;
        }

        // Unknown event - just show hex ID
        const unknown = colorize('UNKNOWN', Colors.red);
        const eventId = colorize(`EVENT_0x${type.toString(16).padStart(4, '0')}`, Colors.brightRed);
        return `${unknown}::${eventId}`;
    }

    private getCategoryColor(category: EventCategory): string {
        const categoryColors: { [key in EventCategory]: string } = {
            [EventCategory.SYSTEM]: Colors.brightMagenta,
            [EventCategory.BOOT]: Colors.brightGreen,
            [EventCategory.PROCESS]: Colors.brightBlue,
            [EventCategory.MEMORY]: Colors.brightYellow,
            [EventCategory.INTERRUPT]: Colors.brightRed,
            [EventCategory.SYNC]: Colors.brightCyan,
            [EventCategory.IO]: Colors.magenta,
            [EventCategory.FILESYSTEM]: Colors.green,
            [EventCategory.NETWORK]: Colors.blue,
        };
        return categoryColors[category] || Colors.white;
    }

    private getSeverityColor(severity: EventSeverity): string {
        const severityColors: { [key in EventSeverity]: string } = {
            [EventSeverity.DEBUG]: Colors.dim,
            [EventSeverity.INFO]: Colors.white,
            [EventSeverity.WARNING]: Colors.yellow,
            [EventSeverity.ERROR]: Colors.red,
            [EventSeverity.CRITICAL]: Colors.brightRed + Colors.bold,
        };
        return severityColors[severity] || Colors.white;
    }
}
