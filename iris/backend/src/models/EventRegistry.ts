/**
 * Centralized registry for all IRIS event definitions.
 * Provides metadata and descriptions for kernel events.
 */

export enum EventCategory {
    SYSTEM = 'SYSTEM',
    BOOT = 'BOOT',
    PROCESS = 'PROCESS',
    MEMORY = 'MEMORY',
    INTERRUPT = 'INTERRUPT',
    SYNC = 'SYNC',
    IO = 'IO',
    FILESYSTEM = 'FS',
    NETWORK = 'NET',
}

export enum EventSeverity {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

export interface EventDefinition {
    id: number;
    name: string;
    category: EventCategory;
    description: string;
    severity: EventSeverity;
}

/**
 * Registry for looking up event definitions by ID.
 */
export class EventRegistry {
    private static instance: EventRegistry;
    private events = new Map<number, EventDefinition>();

    private constructor() {
        this.registerDefaultEvents();
    }

    static getInstance(): EventRegistry {
        if (!EventRegistry.instance) {
            EventRegistry.instance = new EventRegistry();
        }
        return EventRegistry.instance;
    }

    /**
     * Register an event definition.
     */
    register(event: EventDefinition): void {
        this.events.set(event.id, event);
    }

    /**
     * Look up an event definition by ID.
     */
    lookup(id: number): EventDefinition | undefined {
        return this.events.get(id);
    }

    /**
     * Get all events in a specific category.
     */
    getByCategory(category: EventCategory): EventDefinition[] {
        return Array.from(this.events.values())
            .filter(event => event.category === category);
    }

    /**
     * Get all events with a specific severity.
     */
    getBySeverity(severity: EventSeverity): EventDefinition[] {
        return Array.from(this.events.values())
            .filter(event => event.severity === severity);
    }

    /**
     * Register all default kernel events.
     * This should match the event definitions in kernel/include/iris/event_types.h
     */
    private registerDefaultEvents(): void {
        // System Events (0x0000 - 0x00FF)
        this.register({ id: 0x0001, name: 'IRIS_INIT', category: EventCategory.SYSTEM, description: 'IRIS debug system initialized', severity: EventSeverity.INFO });

        // Boot Events (0x0100 - 0x01FF)
        this.register({ id: 0x0100, name: 'BOOT_START', category: EventCategory.BOOT, description: 'Kernel boot sequence started', severity: EventSeverity.INFO });
        this.register({ id: 0x0101, name: 'GDT_LOADED', category: EventCategory.BOOT, description: 'Global Descriptor Table loaded', severity: EventSeverity.INFO });
        this.register({ id: 0x0102, name: 'TSS_LOADED', category: EventCategory.BOOT, description: 'Task State Segment configured', severity: EventSeverity.INFO });

        // Future event categories will be added here as they're implemented in the kernel
        // Process/Thread Events (0x0200 - 0x02FF)
        // Memory Events (0x0300 - 0x03FF)
        // Interrupt Events (0x0400 - 0x04FF)
        // Synchronization Events (0x0500 - 0x05FF)
        // I/O Events (0x0600 - 0x06FF)
        // Filesystem Events (0x0700 - 0x07FF)
        // Network Events (0x0800 - 0x08FF)
    }
}

// Export singleton instance for convenience
export const eventRegistry = EventRegistry.getInstance();
