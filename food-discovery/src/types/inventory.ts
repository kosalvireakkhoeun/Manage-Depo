export type UserRole = 'admin' | 'staff'

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  barcode: string
  description: string | null
  image_url: string | null
  category_id: string | null
  category_name: string | null
  cost_price: number
  wholesale_price: number
  retail_price: number
  unit: string
  created_at: string
}

export interface ProductMutationInput {
  name: string
  barcode: string
  description: string | null
  category_id: string | null
  cost_price: number
  wholesale_price: number
  retail_price: number
  unit: string
}

export interface Profile {
  id: string
  email: string | null
  role: UserRole
  created_at: string
}

export interface ProductFilterInput {
  nameQuery: string
  barcodeQuery: string
  categoryId: string
}

export interface InventoryStats {
  productCount: number
  categoryCount: number
  adminCount: number
  staffCount: number
}