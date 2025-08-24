#ifndef MEMORY_H
#define MEMORY_H

#include <core/types.h>

namespace memory {

/**
 * @brief Compares two memory regions byte by byte.
 *
 * Performs lexicographic comparison of memory regions without assuming
 * any specific data interpretation. Returns zero for identical regions,
 * negative value if first differing byte in lhs is less than rhs,
 * positive value otherwise.
 *
 * @param lhs Pointer to the first memory region.
 * @param rhs Pointer to the second memory region.
 * @param count Number of bytes to compare.
 * @return int Zero if regions are identical, negative if lhs < rhs, positive if lhs > rhs.
 */
int memcmp(const void* lhs, const void* rhs, size_t count);

/**
 * @brief Copies memory from source to destination.
 *
 * Performs byte-wise copy from source to destination. Behavior is undefined
 * if memory regions overlap; use memmove for overlapping regions.
 * Optimized for word-aligned operations when possible.
 *
 * @param dest Pointer to destination memory region.
 * @param src Pointer to source memory region.
 * @param count Number of bytes to copy.
 * @return void* Pointer to destination (same as dest parameter).
 */
void* memcpy(void* dest, const void* src, size_t count);

/**
 * @brief Safely copies memory between potentially overlapping regions.
 *
 * Handles overlapping memory regions correctly by choosing appropriate
 * copy direction. Uses memcpy optimization when regions don't overlap.
 *
 * @param dest Pointer to destination memory region.
 * @param src Pointer to source memory region.
 * @param count Number of bytes to copy.
 * @return void* Pointer to destination (same as dest parameter).
 */
void* memmove(void* dest, const void* src, size_t count);

/**
 * @brief Sets memory region to specified byte value.
 *
 * Fills memory region with the specified byte value, optimized
 * for word-aligned operations when possible.
 *
 * @param dest Pointer to memory region to fill.
 * @param value Byte value to fill with (only low 8 bits used).
 * @param count Number of bytes to set.
 * @return void* Pointer to destination (same as dest parameter).
 */
void* memset(void* dest, int value, size_t count);

/**
 * @brief Sets memory region to zero.
 *
 * Optimized version of memset for zero initialization.
 *
 * @param dest Pointer to memory region to zero.
 * @param count Number of bytes to zero.
 * @return void* Pointer to destination (same as dest parameter).
 */
void* memzero(void* dest, size_t count);

} // namespace memory

#endif
