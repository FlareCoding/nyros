#ifndef IRIS_EVENT_TYPES_H
#define IRIS_EVENT_TYPES_H

#include <core/types.h>

namespace iris {

// Event type definitions for IRIS debug protocol
// Organized by category for future expansion

// System Events (0x0000 - 0x00FF)
inline constexpr uint16_t EVENT_IRIS_INIT = 0x0001; // IRIS system initialized

// Boot Events (0x0100 - 0x01FF)
inline constexpr uint16_t EVENT_BOOT_START = 0x0100; // Kernel boot started

// Future categories reserved:
// Process/Thread Events (0x0200 - 0x02FF)
// Memory Events (0x0300 - 0x03FF)
// Interrupt Events (0x0400 - 0x04FF)
// Synchronization Events (0x0500 - 0x05FF)
// I/O Events (0x0600 - 0x06FF)
// Filesystem Events (0x0700 - 0x07FF)
// Network Events (0x0800 - 0x08FF)

} // namespace iris

#endif
