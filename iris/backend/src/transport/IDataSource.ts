/**
 * Interface for data sources that provide raw binary data streams.
 * Implementations can use Unix sockets, TCP, files, etc.
 */
export interface IDataSource {
    /**
     * Register a handler for incoming data chunks.
     */
    onData(handler: (data: Buffer) => void): void;

    /**
     * Register a handler for error events.
     */
    onError(handler: (error: Error) => void): void;

    /**
     * Register a handler for connection close events.
     */
    onClose(handler: () => void): void;

    /**
     * Establish connection to the data source.
     */
    connect(): Promise<void>;

    /**
     * Disconnect from the data source.
     */
    disconnect(): void;

    /**
     * Check if currently connected.
     */
    isConnected(): boolean;
}
