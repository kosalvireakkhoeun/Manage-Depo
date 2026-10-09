import { defineStore } from 'pinia'
import type {
  Category,
  InventoryStats,
  Product,
  ProductMutationInput,
  ProductSearchInput,
  Profile,
  UserRole,
} from '@/types/inventory'
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getInventoryStats,
  listCategories,
  listProfiles,
  searchProducts,
  updateCategory,
  updateProduct,
  updateProfileRole,
} from '@/utils/inventoryService'
import { useAuthStore } from '@/stores/auth'

interface InventoryState {
  products: Product[]
  totalProducts: number
  productSearch: ProductSearchInput
  categories: Category[]
  profiles: Profile[]
  stats: InventoryStats | null
  loadingProducts: boolean
  loadingCategories: boolean
  loadingProfiles: boolean
  loadingStats: boolean
  submitting: boolean
  error: string | null
}

const DEFAULT_PRODUCT_SEARCH: ProductSearchInput = {
  nameQuery: '',
  barcodeQuery: '',
  categoryId: '',
  page: 1,
  perPage: 10,
}

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => left.name.localeCompare(right.name))
}

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryState => ({
    products: [],
    totalProducts: 0,
    productSearch: { ...DEFAULT_PRODUCT_SEARCH },
    categories: [],
    profiles: [],
    stats: null,
    loadingProducts: false,
    loadingCategories: false,
    loadingProfiles: false,
    loadingStats: false,
    submitting: false,
    error: null,
  }),

  getters: {
    categoryOptions: (state): { label: string; value: string }[] =>
      state.categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
  },

  actions: {
    getMappedCategoryName(categoryId: string | null): string | undefined {
      return this.categories.find((category) => category.id === categoryId)?.name
    },

    clearError() {
      this.error = null
    },

    async fetchProducts(partialSearch?: Partial<ProductSearchInput>) {
      this.loadingProducts = true
      this.error = null

      try {
        const searchInput = {
          ...this.productSearch,
          ...partialSearch,
        }

        searchInput.page = Math.max(1, searchInput.page || 1)
        searchInput.perPage = Math.max(1, searchInput.perPage || DEFAULT_PRODUCT_SEARCH.perPage)

        this.productSearch = searchInput

        const result = await searchProducts(searchInput)
        this.products = result.items
        this.totalProducts = result.totalItems
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load products.'
      } finally {
        this.loadingProducts = false
      }
    },

    async fetchCategories() {
      this.loadingCategories = true
      this.error = null

      try {
        this.categories = sortCategories(await listCategories())
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load categories.'
      } finally {
        this.loadingCategories = false
      }
    },

    async fetchProfiles() {
      this.loadingProfiles = true
      this.error = null

      try {
        this.profiles = await listProfiles()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load user profiles.'
      } finally {
        this.loadingProfiles = false
      }
    },

    async fetchStats() {
      this.loadingStats = true
      this.error = null

      try {
        this.stats = await getInventoryStats()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load dashboard statistics.'
      } finally {
        this.loadingStats = false
      }
    },

    async fetchInitialInventory() {
      await Promise.all([this.fetchProducts(), this.fetchCategories()])
    },

    async saveProduct(input: ProductMutationInput, id?: string, imageFile?: File | null) {
      this.submitting = true
      this.error = null

      try {
        const product = id
          ? await updateProduct(id, input, imageFile)
          : await createProduct(input, imageFile)

        const existingIndex = this.products.findIndex(
          (existingProduct) => existingProduct.id === product.id,
        )

        if (existingIndex >= 0) {
          this.products.splice(existingIndex, 1, product)
        }

        await this.fetchProducts()

        return product
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save product.'
        throw error
      } finally {
        this.submitting = false
      }
    },

    async removeProduct(product: Product) {
      this.submitting = true
      this.error = null

      try {
        await deleteProduct(product)
        await this.fetchProducts()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete product.'
        throw error
      } finally {
        this.submitting = false
      }
    },

    async saveCategory(name: string, id?: string) {
      this.submitting = true
      this.error = null

      try {
        const category = id ? await updateCategory(id, name) : await createCategory(name)
        const existingIndex = this.categories.findIndex(
          (existingCategory) => existingCategory.id === category.id,
        )

        if (existingIndex >= 0) {
          this.categories.splice(existingIndex, 1, category)
        } else {
          this.categories.push(category)
        }

        this.categories = sortCategories(this.categories)
        return category
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save category.'
        throw error
      } finally {
        this.submitting = false
      }
    },

    async removeCategory(id: string) {
      this.submitting = true
      this.error = null

      try {
        await deleteCategory(id)
        this.categories = this.categories.filter((category) => category.id !== id)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete category.'
        throw error
      } finally {
        this.submitting = false
      }
    },

    async changeUserRole(profileId: string, role: UserRole) {
      this.submitting = true
      this.error = null

      try {
        const updatedProfile = await updateProfileRole(profileId, role)
        const existingIndex = this.profiles.findIndex((profile) => profile.id === profileId)

        if (existingIndex >= 0) {
          this.profiles.splice(existingIndex, 1, updatedProfile)
        }

        const authStore = useAuthStore()
        authStore.applyProfileRole(profileId, role)

        return updatedProfile
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update user role.'
        throw error
      } finally {
        this.submitting = false
      }
    },
  },
})
