import type { ProductMutationInput } from '@/types/inventory'

export interface ProductFormValues {
  name: string
  barcode: string
  description: string
  category_id: string
  cost_price: string
  wholesale_price: string
  retail_price: string
  unit: string
}

function toNonNegativeNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN
}

export function buildProductPayload(values: ProductFormValues): ProductMutationInput | null {
  const costPrice = toNonNegativeNumber(values.cost_price)
  const wholesalePrice = toNonNegativeNumber(values.wholesale_price)
  const retailPrice = toNonNegativeNumber(values.retail_price)

  if (
    !values.name.trim() ||
    !values.barcode.trim() ||
    !values.unit.trim() ||
    Number.isNaN(costPrice) ||
    Number.isNaN(wholesalePrice) ||
    Number.isNaN(retailPrice)
  ) {
    return null
  }

  return {
    name: values.name,
    barcode: values.barcode,
    description: values.description || null,
    category_id: values.category_id || null,
    cost_price: costPrice,
    wholesale_price: wholesalePrice,
    retail_price: retailPrice,
    unit: values.unit,
  }
}