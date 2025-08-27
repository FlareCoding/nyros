import { create } from 'zustand';

interface IrisEvent {
    timestamp: number;
    sequenceNumber: number;
    eventType: number;
    cpuId: number;
    decodedPayload?: any;
    // Add display metadata
    id: string; // For React keys
    receivedAt: number; // When we received it
}

interface EventStore {
    events: IrisEvent[];
    maxEvents: number;
    addEvent: (event: any) => void;
    clearEvents: () => void;
}

export const useEventStore = create<EventStore>((set) => ({
    events: [],
    maxEvents: 1000, // Keep last 1000 events

    addEvent: (rawEvent) => set((state) => {
        // Create display event with metadata
        const event: IrisEvent = {
            ...rawEvent,
            id: `${rawEvent.sequenceNumber}-${Date.now()}`,
            receivedAt: Date.now()
        };

        // Add to beginning and trim if needed
        const newEvents = [event, ...state.events];
        if (newEvents.length > state.maxEvents) {
            newEvents.length = state.maxEvents;
        }

        return { events: newEvents };
    }),

    clearEvents: () => set({ events: [] })
}));
