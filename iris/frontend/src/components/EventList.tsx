import { useEventStore } from '../stores/eventStore';
import { FixedSizeList as List } from 'react-window';
import { memo } from 'react';

// Map event types to readable names (we'll expand this later)
const EVENT_NAMES: Record<number, string> = {
  0x0001: 'IRIS_INIT',
  0x0100: 'BOOT_START',
  0x0101: 'GDT_LOADED',
  0x0102: 'TSS_LOADED',
  0x0103: 'MEMORY_MAP_FOUND',
  0x0104: 'MEMORY_MAP_PARSED',
  0x0105: 'PMM_INIT_START',
  0x0106: 'PMM_INIT_DONE',
};

// Get severity color based on event type
const getSeverityColor = (eventType: number): string => {
  if (eventType < 0x0100) return '#3b82f6'; // System events - blue
  if (eventType < 0x0200) return '#10b981'; // Boot events - green
  if (eventType < 0x0300) return '#facc15'; // Warning events - yellow
  return '#94a3b8'; // Default - gray
};

interface EventRowProps {
  index: number;
  style: React.CSSProperties;
}

const EventRow = memo(({ index, style }: EventRowProps) => {
  const event = useEventStore(state => state.events[index]);

  if (!event) return null;

  const eventName = EVENT_NAMES[event.eventType] || `0x${event.eventType.toString(16).padStart(4, '0').toUpperCase()}`;
  const timestamp = (event.timestamp / 1000000000).toFixed(6); // Convert ns to seconds

  return (
    <div style={{
      ...style,
      display: 'flex',
      alignItems: 'center',
      padding: '4px 8px',
      borderBottom: '1px solid #3a3a3a',
      fontFamily: 'monospace',
      fontSize: '14px',
      gap: '12px',
      backgroundColor: '#2a2a2a',
      color: '#e0e0e0'
    }}>
      {/* Sequence number */}
      <span style={{
        minWidth: '60px',
        color: '#808080'
      }}>
        #{event.sequenceNumber}
      </span>

      {/* Timestamp */}
      <span style={{
        minWidth: '100px',
        color: '#808080'
      }}>
        {timestamp}s
      </span>

      {/* CPU */}
      <span style={{
        minWidth: '50px',
        color: '#808080'
      }}>
        CPU{event.cpuId}
      </span>

      {/* Event name with color */}
      <span style={{
        color: getSeverityColor(event.eventType),
        fontWeight: 500,
        minWidth: '150px'
      }}>
        {eventName}
      </span>

      {/* Payload indicator */}
      {event.decodedPayload && (
        <span style={{
          color: '#606060',
          fontSize: '12px'
        }}>
          [has payload]
        </span>
      )}
    </div>
  );
});

export function EventList() {
  const events = useEventStore(state => state.events);
  const clearEvents = useEventStore(state => state.clearEvents);

  if (events.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#606060',
        fontFamily: 'monospace',
        backgroundColor: '#2a2a2a'
      }}>
        No events received yet...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0 // Important for flexbox
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '2px solid #3a3a3a',
        backgroundColor: '#1f1f1f'
      }}>
        <div style={{ fontWeight: 600, color: '#ffffff' }}>
          Events ({events.length})
        </div>
        <button
          onClick={clearEvents}
          style={{
            padding: '4px 12px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
        >
          Clear
        </button>
      </div>

      {/* Virtual scrolling list */}
      <div style={{ flex: 1, minHeight: '400px' }}>
        <List
          height={Math.max(400, window.innerHeight - 300)} // Dynamic height with minimum
          itemCount={events.length}
          itemSize={32} // Height of each row
          width="100%"
          style={{ backgroundColor: '#2a2a2a' }}
        >
          {EventRow}
        </List>
      </div>
    </div>
  );
}
