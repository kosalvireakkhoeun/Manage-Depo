import { describe, expect, it } from 'vitest'
import { paginateItems } from '@/utils/pagination'

describe('paginateItems', () => {
  it('returns the expected slice and metadata for a valid page', () => {
    const result = paginateItems([1, 2, 3, 4, 5, 6], 2, 2)

    expect(result).toEqual({
      pageItems: [3, 4],
      currentPage: 2,
      perPage: 2,
      totalItems: 6,
      totalPages: 3,
      startItem: 3,
      endItem: 4,
    })
  })

  it('clamps current page to the last page when requested page is too large', () => {
    const result = paginateItems(['a', 'b', 'c'], 10, 2)

    expect(result.currentPage).toBe(2)
    expect(result.pageItems).toEqual(['c'])
    expect(result.startItem).toBe(3)
    expect(result.endItem).toBe(3)
  })

  it('normalizes invalid page and per-page values to safe defaults', () => {
    const result = paginateItems([1, 2, 3], 0, 0)

    expect(result.currentPage).toBe(1)
    expect(result.perPage).toBe(10)
    expect(result.pageItems).toEqual([1, 2, 3])
    expect(result.totalPages).toBe(1)
  })

  it('returns stable metadata for an empty list', () => {
    const result = paginateItems([], 3, 5)

    expect(result).toEqual({
      pageItems: [],
      currentPage: 1,
      perPage: 5,
      totalItems: 0,
      totalPages: 1,
      startItem: 0,
      endItem: 0,
    })
  })
})
