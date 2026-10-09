import type { Product, ProductFilterInput } from '@/types/inventory'

export function filterProducts(products: Product[], filters: ProductFilterInput): Product[] {
  const normalizedNameQuery = filters.nameQuery.trim().toLowerCase()
  const normalizedBarcodeQuery = filters.barcodeQuery.trim().toLowerCase()
  const normalizedCategoryId = filters.categoryId.trim()

  return products.filter((product) => {
    const matchesName =
      normalizedNameQuery.length === 0 || product.name.toLowerCase().includes(normalizedNameQuery)

    const matchesBarcode =
      normalizedBarcodeQuery.length === 0 ||
      product.barcode.toLowerCase().includes(normalizedBarcodeQuery)

    const matchesCategory =
      normalizedCategoryId.length === 0 || product.category_id === normalizedCategoryId

    return matchesName && matchesBarcode && matchesCategory
  })
}
