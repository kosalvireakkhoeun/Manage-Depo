export interface PaginationResult<T> {
  pageItems: T[]
  currentPage: number
  perPage: number
  totalItems: number
  totalPages: number
  startItem: number
  endItem: number
}

function normalizePositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  const roundedValue = Math.floor(value)

  return roundedValue > 0 ? roundedValue : fallback
}

export function paginateItems<T>(items: T[], page: number, perPage: number): PaginationResult<T> {
  const normalizedPerPage = normalizePositiveInteger(perPage, 10)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPerPage))
  const requestedPage = normalizePositiveInteger(page, 1)
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages)
  const startIndex = (currentPage - 1) * normalizedPerPage
  const pageItems = items.slice(startIndex, startIndex + normalizedPerPage)
  const startItem = totalItems === 0 ? 0 : startIndex + 1
  const endItem = totalItems === 0 ? 0 : startIndex + pageItems.length

  return {
    pageItems,
    currentPage,
    perPage: normalizedPerPage,
    totalItems,
    totalPages,
    startItem,
    endItem,
  }
}