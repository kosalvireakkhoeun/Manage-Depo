import { supabase } from '@/utils/supabase'
import type {
  Category,
  InventoryStats,
  Product,
  ProductMutationInput,
  ProductSearchInput,
  ProductSearchResult,
  Profile,
  UserRole,
} from '@/types/inventory'

const PRODUCT_BUCKET = 'product-images'

interface ProductRow {
  id: string
  name: string
  barcode: string
  description: string | null
  image_url: string | null
  category_id: string | null
  cost_price: number | string | null
  wholesale_price: number | string | null
  retail_price: number | string | null
  unit: string
  created_at: string
  category_name?: string | null
  categories?: {
    name: string
  } | null
}

interface SearchProductsRpcResponse {
  items?: ProductRow[] | null
  totalItems?: number | string | null
}

function toPrice(value: number | string | null): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function normalizeRole(value: string | null): UserRole {
  return value === 'admin' ? 'admin' : 'staff'
}

function normalizeProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode,
    description: row.description,
    image_url: row.image_url,
    category_id: row.category_id,
    category_name: row.category_name ?? row.categories?.name ?? null,
    cost_price: toPrice(row.cost_price),
    wholesale_price: toPrice(row.wholesale_price),
    retail_price: toPrice(row.retail_price),
    unit: row.unit,
    created_at: row.created_at,
  }
}

function mapProductPayload(input: ProductMutationInput) {
  return {
    name: input.name.trim(),
    barcode: input.barcode.trim(),
    description: input.description?.trim() || null,
    category_id: input.category_id || null,
    cost_price: toPrice(input.cost_price),
    wholesale_price: toPrice(input.wholesale_price),
    retail_price: toPrice(input.retail_price),
    unit: input.unit.trim(),
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase()
}

function getStoragePathFromPublicUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/product-images/'
  const markerIndex = url.indexOf(marker)

  if (markerIndex === -1) {
    return null
  }

  return decodeURIComponent(url.slice(markerIndex + marker.length))
}

async function uploadProductImage(file: File): Promise<string> {
  const uniqueFileName = `${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
  const storagePath = `products/${uniqueFileName}`

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(storagePath, file, { upsert: false })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(storagePath)

  return data.publicUrl
}

async function removeProductImageByUrl(imageUrl: string | null): Promise<void> {
  if (!imageUrl) {
    return
  }

  const imagePath = getStoragePathFromPublicUrl(imageUrl)

  if (!imagePath) {
    return
  }

  const { error } = await supabase.storage.from(PRODUCT_BUCKET).remove([imagePath])

  if (error) {
    console.warn(`Failed to delete image from storage: ${error.message}`)
  }
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name')

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function createCategory(name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim() })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((product) => normalizeProduct(product as ProductRow))
}

export async function searchProducts(input: ProductSearchInput): Promise<ProductSearchResult> {
  const nameQuery = input.nameQuery.trim()
  const barcodeQuery = input.barcodeQuery.trim()
  const categoryId = input.categoryId.trim()

  const { data, error } = await supabase.rpc('search_products', {
    p_name: nameQuery || null,
    p_barcode: barcodeQuery || null,
    p_category_id: categoryId || null,
    p_page: input.page,
    p_per_page: input.perPage,
  })

  if (error) {
    throw new Error(error.message)
  }

  const payload = (data ?? {}) as SearchProductsRpcResponse
  const items = (payload.items ?? []).map((product) => normalizeProduct(product))
  const totalItems = Number(payload.totalItems ?? 0)

  return {
    items,
    totalItems: Number.isFinite(totalItems) ? totalItems : 0,
  }
}

export async function createProduct(
  input: ProductMutationInput,
  imageFile?: File | null,
): Promise<Product> {
  let imageUrl: string | null = null

  if (imageFile) {
    imageUrl = await uploadProductImage(imageFile)
  }

  const payload = {
    ...mapProductPayload(input),
    image_url: imageUrl,
  }

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*, categories(name)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeProduct(data as ProductRow)
}

export async function updateProduct(
  id: string,
  input: ProductMutationInput,
  imageFile?: File | null,
): Promise<Product> {
  const { data: currentProduct } = await supabase
    .from('products')
    .select('image_url')
    .eq('id', id)
    .maybeSingle()

  let imageUrl = currentProduct?.image_url ?? null

  if (imageFile) {
    const oldImageUrl = imageUrl
    imageUrl = await uploadProductImage(imageFile)
    await removeProductImageByUrl(oldImageUrl)
  }

  const payload = {
    ...mapProductPayload(input),
    image_url: imageUrl,
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('*, categories(name)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeProduct(data as ProductRow)
}

export async function deleteProduct(product: Product): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', product.id)

  if (error) {
    throw new Error(error.message)
  }

  await removeProductImageByUrl(product.image_url)
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    role: normalizeRole(profile.role),
    created_at: profile.created_at,
  }))
}

export async function updateProfileRole(id: string, role: UserRole): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    email: data.email,
    role: normalizeRole(data.role),
    created_at: data.created_at,
  }
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const [productResult, categoryResult, profileResult] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('role'),
  ])

  if (productResult.error) {
    throw new Error(productResult.error.message)
  }

  if (categoryResult.error) {
    throw new Error(categoryResult.error.message)
  }

  if (profileResult.error) {
    throw new Error(profileResult.error.message)
  }

  const profiles = profileResult.data ?? []
  const adminCount = profiles.filter((profile) => profile.role === 'admin').length

  return {
    productCount: productResult.count ?? 0,
    categoryCount: categoryResult.count ?? 0,
    adminCount,
    staffCount: profiles.length - adminCount,
  }
}
