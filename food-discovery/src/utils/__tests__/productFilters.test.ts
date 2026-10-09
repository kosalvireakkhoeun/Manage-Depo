import { describe, expect, it } from 'vitest'
import type { Product } from '@/types/inventory'
import { filterProducts } from '@/utils/productFilters'

const products: Product[] = [
  {
    id: 'p-1',
    name: 'Coca Cola',
    barcode: 'ABC-12345',
    description: null,
    image_url: null,
    category_id: 'cat-drinks',
    category_name: 'Drinks',
    cost_price: 0.8,
    wholesale_price: 1,
    retail_price: 1.25,
    unit: 'pcs',
    created_at: '2026-10-09T00:00:00.000Z',
  },
  {
    id: 'p-2',
    name: 'Potato Chips',
    barcode: 'SNK-99887',
    description: null,
    image_url: null,
    category_id: 'cat-snacks',
    category_name: 'Snacks',
    cost_price: 1,
    wholesale_price: 1.2,
    retail_price: 1.5,
    unit: 'pack',
    created_at: '2026-10-09T00:00:00.000Z',
  },
]

describe('filterProducts', () => {
  it('returns all products when filters are empty', () => {
    const result = filterProducts(products, {
      nameQuery: '',
      barcodeQuery: '',
      categoryId: '',
    })

    expect(result).toHaveLength(2)
  })

  it('filters by partial name case-insensitively', () => {
    const result = filterProducts(products, {
      nameQuery: 'cola',
      barcodeQuery: '',
      categoryId: '',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('p-1')
  })

  it('filters by partial barcode', () => {
    const result = filterProducts(products, {
      nameQuery: '',
      barcodeQuery: '998',
      categoryId: '',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('p-2')
  })

  it('combines category and text filters', () => {
    const result = filterProducts(products, {
      nameQuery: 'chips',
      barcodeQuery: '998',
      categoryId: 'cat-snacks',
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('p-2')
  })

  it('returns empty list when no product matches', () => {
    const result = filterProducts(products, {
      nameQuery: 'water',
      barcodeQuery: '',
      categoryId: '',
    })

    expect(result).toHaveLength(0)
  })
})
