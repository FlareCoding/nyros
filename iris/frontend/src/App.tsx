import './App.css'
import { useIrisConnection } from './hooks/useIrisConnection'
import { EventList } from './components/EventList'

function App() {
  const { status, eventCount } = useIrisConnection();

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#4ade80'; // green
      case 'connecting':
        return '#facc15'; // yellow
      case 'error':
        return '#ef4444'; // red
      default:
        return '#94a3b8'; // gray
    }
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 20px 0', color: '#ffffff' }}>IRIS Frontend v0.1.0</h1>

        {/* Connection info bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Connection status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: getStatusColor()
              }} />
              <span style={{ fontWeight: 500 }}>
                {status.toUpperCase()}
              </span>
            </div>

            {/* Event count */}
            <div style={{ color: '#a0a0a0' }}>
              Total events: <strong style={{ color: '#ffffff' }}>{eventCount}</strong>
            </div>
          </div>

          {/* Endpoint info */}
          <div style={{ color: '#808080', fontSize: '12px' }}>
            ws://localhost:3001/ws
          </div>
        </div>
      </div>

      {/* Event list */}
      <div style={{
        flex: 1,
        border: '1px solid #3a3a3a',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#2a2a2a',
        minHeight: 0 // Important for flexbox
      }}>
        <EventList />
      </div>
    </div>
  )
}

export default App
