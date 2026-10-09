import { describe, expect, it } from 'vitest'
import { buildProductPayload } from '@/utils/productValidation'

describe('buildProductPayload', () => {
  it('builds payload when all required fields are valid', () => {
    const payload = buildProductPayload({
      name: 'Milk',
      barcode: '123456',
      description: '1L',
      category_id: 'cat-drinks',
      cost_price: '1.2',
      wholesale_price: '1.5',
      retail_price: '1.8',
      unit: 'pcs',
    })

    expect(payload).toEqual({
      name: 'Milk',
      barcode: '123456',
      description: '1L',
      category_id: 'cat-drinks',
      cost_price: 1.2,
      wholesale_price: 1.5,
      retail_price: 1.8,
      unit: 'pcs',
    })
  })

  it('returns null when required text field is missing', () => {
    const payload = buildProductPayload({
      name: '',
      barcode: '123456',
      description: '',
      category_id: '',
      cost_price: '1',
      wholesale_price: '1',
      retail_price: '1',
      unit: 'pcs',
    })

    expect(payload).toBeNull()
  })

  it('returns null for negative or invalid price values', () => {
    const negativePayload = buildProductPayload({
      name: 'Milk',
      barcode: '123456',
      description: '',
      category_id: '',
      cost_price: '-1',
      wholesale_price: '1',
      retail_price: '1',
      unit: 'pcs',
    })

    const invalidPayload = buildProductPayload({
      name: 'Milk',
      barcode: '123456',
      description: '',
      category_id: '',
      cost_price: 'abc',
      wholesale_price: '1',
      retail_price: '1',
      unit: 'pcs',
    })

    expect(negativePayload).toBeNull()
    expect(invalidPayload).toBeNull()
  })
})