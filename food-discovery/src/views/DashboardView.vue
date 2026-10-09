<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { Product } from '@/types/inventory'
import { useInventoryStore } from '@/stores/inventory'
import { buildProductPayload, type ProductFormValues } from '@/utils/productValidation'

const inventoryStore = useInventoryStore()

const editingProductId = ref<string | null>(null)
const selectedImage = ref<File | null>(null)
const selectedImagePreviewUrl = ref<string | null>(null)
const editingProductImageUrl = ref<string | null>(null)
const feedbackMessage = ref<string | null>(null)
const feedbackKind = ref<'success' | 'error'>('success')
const productManagementCurrentPage = ref(1)
const productManagementPerPage = ref(10)
const perPageOptions = [10, 20, 50]
const productFilters = reactive({
  nameQuery: '',
  barcodeQuery: '',
  categoryId: '',
})
const activeProductFilters = reactive({
  nameQuery: '',
  barcodeQuery: '',
  categoryId: '',
})
const isProductFormDialogOpen = ref(false)
const isProductFormDialogMinimized = ref(false)
const selectedProduct = ref<Product | null>(null)
const isProductDetailOpen = ref(false)

const productForm = reactive<ProductFormValues>({
  name: '',
  barcode: '',
  description: '',
  category_id: '',
  cost_price: '',
  wholesale_price: '',
  retail_price: '',
  unit: '',
})

const isBusy = computed(
  () =>
    inventoryStore.submitting ||
    inventoryStore.loadingProducts ||
    inventoryStore.loadingCategories ||
    inventoryStore.loadingStats,
)
const isProductTableLoading = computed(() => inventoryStore.loadingProducts)

const productManagementPagination = computed(() => {
  const totalItems = inventoryStore.totalProducts
  const totalPages = Math.max(1, Math.ceil(totalItems / productManagementPerPage.value))
  const normalizedCurrentPage = Math.min(
    Math.max(1, productManagementCurrentPage.value),
    totalPages,
  )
  const startItem =
    totalItems === 0 ? 0 : (normalizedCurrentPage - 1) * productManagementPerPage.value + 1
  const endItem = totalItems === 0 ? 0 : startItem + inventoryStore.products.length - 1

  return {
    pageItems: inventoryStore.products,
    totalItems,
    totalPages,
    currentPage: normalizedCurrentPage,
    startItem,
    endItem,
  }
})

const productImagePreview = computed(
  () => selectedImagePreviewUrl.value ?? editingProductImageUrl.value,
)

function clearSelectedImagePreview() {
  if (selectedImagePreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(selectedImagePreviewUrl.value)
  }

  selectedImagePreviewUrl.value = null
}

function resetForm() {
  productForm.name = ''
  productForm.barcode = ''
  productForm.description = ''
  productForm.category_id = ''
  productForm.cost_price = ''
  productForm.wholesale_price = ''
  productForm.retail_price = ''
  productForm.unit = ''
  clearSelectedImagePreview()
  selectedImage.value = null
  editingProductImageUrl.value = null
  editingProductId.value = null
}

function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  clearSelectedImagePreview()
  selectedImage.value = input.files?.[0] ?? null

  if (selectedImage.value) {
    selectedImagePreviewUrl.value = URL.createObjectURL(selectedImage.value)
  }
}

function startEdit(product: Product) {
  clearSelectedImagePreview()
  editingProductId.value = product.id
  productForm.name = product.name
  productForm.barcode = product.barcode
  productForm.description = product.description ?? ''
  productForm.category_id = product.category_id ?? ''
  productForm.cost_price = String(product.cost_price)
  productForm.wholesale_price = String(product.wholesale_price)
  productForm.retail_price = String(product.retail_price)
  productForm.unit = product.unit
  selectedImage.value = null
  editingProductImageUrl.value = product.image_url
  feedbackMessage.value = null
  isProductFormDialogOpen.value = true
  isProductFormDialogMinimized.value = false
}

function openCreateProductDialog() {
  resetForm()
  feedbackMessage.value = null
  isProductFormDialogOpen.value = true
  isProductFormDialogMinimized.value = false
}

function minimizeProductFormDialog() {
  isProductFormDialogMinimized.value = true
}

function restoreProductFormDialog() {
  isProductFormDialogMinimized.value = false
}

function closeProductFormDialog() {
  isProductFormDialogOpen.value = false
  isProductFormDialogMinimized.value = false
}

function openProductDetail(product: Product) {
  selectedProduct.value = product
  isProductDetailOpen.value = true
}

function closeProductDetail() {
  selectedProduct.value = null
  isProductDetailOpen.value = false
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function goToPreviousProductManagementPage() {
  productManagementCurrentPage.value = Math.max(1, productManagementCurrentPage.value - 1)
}

function goToNextProductManagementPage() {
  productManagementCurrentPage.value = Math.min(
    productManagementPagination.value.totalPages,
    productManagementCurrentPage.value + 1,
  )
}

async function fetchProductManagementPage() {
  await inventoryStore.fetchProducts({
    nameQuery: activeProductFilters.nameQuery,
    barcodeQuery: activeProductFilters.barcodeQuery,
    categoryId: activeProductFilters.categoryId,
    page: productManagementCurrentPage.value,
    perPage: productManagementPerPage.value,
  })
}

function applyProductSearch() {
  activeProductFilters.nameQuery = productFilters.nameQuery
  activeProductFilters.barcodeQuery = productFilters.barcodeQuery
  activeProductFilters.categoryId = productFilters.categoryId

  if (productManagementCurrentPage.value !== 1) {
    productManagementCurrentPage.value = 1
    return
  }

  void fetchProductManagementPage()
}

async function saveProduct() {
  const payload = buildProductPayload(productForm)

  if (!payload) {
    feedbackKind.value = 'error'
    feedbackMessage.value = 'Please fill all required fields and valid non-negative prices.'
    return
  }

  try {
    await inventoryStore.saveProduct(
      payload,
      editingProductId.value ?? undefined,
      selectedImage.value,
    )
    await inventoryStore.fetchStats()
    feedbackKind.value = 'success'
    feedbackMessage.value = editingProductId.value
      ? 'Product updated successfully.'
      : 'Product created successfully.'
    isProductFormDialogOpen.value = false
    isProductFormDialogMinimized.value = false
    resetForm()
  } catch {
    feedbackKind.value = 'error'
    feedbackMessage.value = inventoryStore.error ?? 'Failed to save product.'
  }
}

async function removeProduct(product: Product) {
  if (!window.confirm(`Delete ${product.name}?`)) {
    return
  }

  try {
    await inventoryStore.removeProduct(product)
    await inventoryStore.fetchStats()
    feedbackKind.value = 'success'
    feedbackMessage.value = 'Product deleted.'
  } catch {
    feedbackKind.value = 'error'
    feedbackMessage.value = inventoryStore.error ?? 'Failed to delete product.'
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

watch(productManagementPerPage, () => {
  productManagementCurrentPage.value = 1
})

watch(
  () => [productManagementCurrentPage.value, productManagementPerPage.value],
  () => {
    void fetchProductManagementPage()
  },
)

watch(productManagementPagination, (pagination) => {
  if (productManagementCurrentPage.value !== pagination.currentPage) {
    productManagementCurrentPage.value = pagination.currentPage
  }
})

onBeforeUnmount(() => {
  clearSelectedImagePreview()
})

onMounted(async () => {
  await Promise.all([
    fetchProductManagementPage(),
    inventoryStore.fetchCategories(),
    inventoryStore.fetchStats(),
  ])
})
</script>

<template>
  <section class="space-y-4">
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <article
        class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Products</p>
        <p class="mt-2 text-2xl font-semibold">{{ inventoryStore.stats?.productCount ?? 0 }}</p>
      </article>
      <article
        class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Categories</p>
        <p class="mt-2 text-2xl font-semibold">{{ inventoryStore.stats?.categoryCount ?? 0 }}</p>
      </article>
      <article
        class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Admins</p>
        <p class="mt-2 text-2xl font-semibold">{{ inventoryStore.stats?.adminCount ?? 0 }}</p>
      </article>
      <article
        class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Staff</p>
        <p class="mt-2 text-2xl font-semibold">{{ inventoryStore.stats?.staffCount ?? 0 }}</p>
      </article>
    </div>

    <div class="grid gap-4">
      <article
        class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-lg font-semibold">Product Management</h3>
          <button
            type="button"
            class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
            @click="openCreateProductDialog"
          >
            Add Product
          </button>
        </div>

        <div class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Search by Name</label>
            <input
              v-model="productFilters.nameQuery"
              type="text"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Type product name"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">Partial Barcode Search</label>
            <input
              v-model="productFilters.barcodeQuery"
              type="text"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Type barcode digits"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">Category</label>
            <select
              v-model="productFilters.categoryId"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">All Categories</option>
              <option
                v-for="category in inventoryStore.categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="mb-4 flex justify-end">
          <button
            type="button"
            class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
            @click="applyProductSearch"
          >
            Search
          </button>
        </div>

        <div
          v-if="isProductTableLoading"
          class="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
        >
          Loading products...
        </div>

        <div
          v-else-if="productManagementPagination.totalItems === 0"
          class="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
        >
          No products found for your current filters.
        </div>

        <template v-else>
          <div
            class="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:block"
          >
            <table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead class="bg-neutral-50 dark:bg-neutral-900">
                <tr class="text-left text-xs uppercase text-neutral-500 dark:text-neutral-400">
                  <th class="px-4 py-3">Image</th>
                  <th class="px-4 py-3">Name</th>
                  <th class="px-4 py-3">Category</th>
                  <th class="px-4 py-3">Barcode</th>
                  <th class="px-4 py-3">Unit</th>
                  <th class="px-4 py-3">Cost</th>
                  <th class="px-4 py-3">Wholesale</th>
                  <th class="px-4 py-3">Retail</th>
                  <th class="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="product in productManagementPagination.pageItems"
                  :key="product.id"
                  class="cursor-pointer text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                  @click="openProductDetail(product)"
                >
                  <td class="px-4 py-3">
                    <div
                      class="h-12 w-12 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
                    >
                      <img
                        v-if="product.image_url"
                        :src="product.image_url"
                        :alt="product.name"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div
                        v-else
                        class="flex h-full w-full items-center justify-center text-xs text-neutral-400"
                      >
                        No
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 font-medium">{{ product.name }}</td>
                  <td class="px-4 py-3">
                    {{ inventoryStore.getMappedCategoryName(product.category_id) || 'No Category' }}
                  </td>
                  <td class="px-4 py-3">{{ product.barcode }}</td>
                  <td class="px-4 py-3">{{ product.unit }}</td>
                  <td class="px-4 py-3">{{ formatPrice(product.cost_price) }}</td>
                  <td class="px-4 py-3">{{ formatPrice(product.wholesale_price) }}</td>
                  <td class="px-4 py-3">{{ formatPrice(product.retail_price) }}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
                        @click.stop="startEdit(product)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                        @click.stop="removeProduct(product)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="grid gap-3 md:hidden">
            <article
              v-for="product in productManagementPagination.pageItems"
              :key="product.id"
              class="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
              @click="openProductDetail(product)"
            >
              <div class="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h4 class="font-semibold">{{ product.name }}</h4>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    Barcode: {{ product.barcode }}
                  </p>
                </div>
                <span class="rounded-full bg-neutral-200 px-2 py-1 text-xs dark:bg-neutral-800">
                  {{ inventoryStore.getMappedCategoryName(product.category_id) || 'No Category' }}
                </span>
              </div>

              <div
                class="mb-3 aspect-square w-full max-h-56 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
              >
                <img
                  v-if="product.image_url"
                  :src="product.image_url"
                  :alt="product.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center text-xs text-neutral-400"
                >
                  No Image
                </div>
              </div>

              <dl class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt class="text-neutral-500 dark:text-neutral-400">Unit</dt>
                  <dd>{{ product.unit }}</dd>
                </div>
                <div>
                  <dt class="text-neutral-500 dark:text-neutral-400">Cost</dt>
                  <dd>{{ formatPrice(product.cost_price) }}</dd>
                </div>
                <div>
                  <dt class="text-neutral-500 dark:text-neutral-400">Wholesale</dt>
                  <dd>{{ formatPrice(product.wholesale_price) }}</dd>
                </div>
                <div>
                  <dt class="text-neutral-500 dark:text-neutral-400">Retail</dt>
                  <dd>{{ formatPrice(product.retail_price) }}</dd>
                </div>
              </dl>

              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  class="rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
                  @click.stop="startEdit(product)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                  @click.stop="removeProduct(product)"
                >
                  Delete
                </button>
              </div>
            </article>
          </div>
        </template>

        <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2 text-sm">
            <label for="product-management-per-page" class="text-neutral-500 dark:text-neutral-400">
              Per page
            </label>
            <select
              id="product-management-per-page"
              v-model.number="productManagementPerPage"
              class="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option v-for="option in perPageOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <span class="text-neutral-500 dark:text-neutral-400">
              Showing {{ productManagementPagination.startItem }}-{{
                productManagementPagination.endItem
              }}
              of
              {{ productManagementPagination.totalItems }}
            </span>
            <button
              type="button"
              class="rounded-md border border-neutral-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700"
              :disabled="productManagementPagination.currentPage === 1"
              @click="goToPreviousProductManagementPage"
            >
              Previous
            </button>
            <span class="text-neutral-500 dark:text-neutral-400">
              {{ productManagementPagination.currentPage }}/{{
                productManagementPagination.totalPages
              }}
            </span>
            <button
              type="button"
              class="rounded-md border border-neutral-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700"
              :disabled="
                productManagementPagination.currentPage === productManagementPagination.totalPages
              "
              @click="goToNextProductManagementPage"
            >
              Next
            </button>
          </div>
        </div>
      </article>
    </div>

    <div
      v-if="isProductFormDialogOpen && !isProductFormDialogMinimized"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeProductFormDialog"
    >
      <article
        class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div class="mb-4 flex items-center justify-between gap-2">
          <div>
            <h3 class="text-lg font-semibold">
              {{ editingProductId ? 'Edit Product' : 'Add Product' }}
            </h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              Required fields are marked by validation.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
              @click="minimizeProductFormDialog"
            >
              Minimize
            </button>
            <button
              type="button"
              class="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
              @click="closeProductFormDialog"
            >
              Close
            </button>
          </div>
        </div>

        <form class="space-y-3" @submit.prevent="saveProduct">
          <div>
            <label class="mb-1 block text-sm">Name</label>
            <input
              v-model="productForm.name"
              type="text"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Product name"
              required
            />
          </div>

          <div>
            <label class="mb-1 block text-sm">Barcode</label>
            <input
              v-model="productForm.barcode"
              type="text"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Unique barcode"
              required
            />
          </div>

          <div>
            <label class="mb-1 block text-sm">Description</label>
            <textarea
              v-model="productForm.description"
              rows="2"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm">Category</label>
            <select
              v-model="productForm.category_id"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">No Category</option>
              <option
                v-for="category in inventoryStore.categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm">Cost Price (តម្លៃទិញចូល)</label>
              <input
                v-model="productForm.cost_price"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm">Wholesale (តម្លៃបោះដុំ)</label>
              <input
                v-model="productForm.wholesale_price"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm">Retail (តម្លៃលក់រាយ)</label>
              <input
                v-model="productForm.retail_price"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                required
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm">Unit</label>
            <input
              v-model="productForm.unit"
              type="text"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              placeholder="pcs, box, pack, kg"
              required
            />
          </div>

          <div>
            <label class="mb-1 block text-sm">Product Image</label>
            <input
              type="file"
              accept="image/*"
              class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-sm file:text-white dark:border-neutral-700 dark:bg-neutral-900 dark:file:bg-white dark:file:text-neutral-900"
              @change="onImageSelected"
            />
            <div
              v-if="productImagePreview"
              class="mt-2 inline-flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
            >
              <img
                :src="productImagePreview"
                alt="Product preview"
                class="h-24 w-24 object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="submit"
              class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900"
              :disabled="isBusy"
            >
              {{ editingProductId ? 'Update Product' : 'Create Product' }}
            </button>
            <button
              v-if="editingProductId"
              type="button"
              class="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
              @click="resetForm"
            >
              Cancel
            </button>
          </div>
        </form>

        <p
          v-if="feedbackMessage"
          class="mt-3 rounded-md px-3 py-2 text-sm"
          :class="
            feedbackKind === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200'
          "
        >
          {{ feedbackMessage }}
        </p>
      </article>
    </div>

    <div
      v-if="isProductFormDialogOpen && isProductFormDialogMinimized"
      class="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-2 py-2 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
    >
      <button type="button" class="rounded-full px-3 py-1" @click="restoreProductFormDialog">
        {{ editingProductId ? 'Editing product…' : 'New product form…' }}
      </button>
      <button
        type="button"
        class="rounded-full border border-neutral-300 px- 'items', v_items, 'totalItems', v_total2 py-1 text-xs dark:border-neutral-700"
        @click="closeProductFormDialog"
      >
        Close
      </button>
    </div>

    <div
      v-if="isProductDetailOpen && selectedProduct"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeProductDetail"
    >
      <article
        class="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      >
        <div class="mb-4 flex items-center justify-between gap-2">
          <h3 class="text-lg font-semibold">Product Detail</h3>
          <button
            type="button"
            class="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
            @click="closeProductDetail"
          >
            Close
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
          <div
            class="flex justify-center w-full max-h-56 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
          >
            <img
              v-if="selectedProduct.image_url"
              :src="selectedProduct.image_url"
              :alt="selectedProduct.name"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-xs text-neutral-400"
            >
              No Image
            </div>
          </div>

          <dl class="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Name</dt>
              <dd class="font-medium">{{ selectedProduct.name }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Category</dt>
              <dd>
                {{
                  inventoryStore.getMappedCategoryName(selectedProduct.category_id) || 'No Category'
                }}
              </dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Barcode</dt>
              <dd>{{ selectedProduct.barcode }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Unit</dt>
              <dd>{{ selectedProduct.unit }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Cost</dt>
              <dd>{{ formatPrice(selectedProduct.cost_price) }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Wholesale</dt>
              <dd>{{ formatPrice(selectedProduct.wholesale_price) }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Retail</dt>
              <dd>{{ formatPrice(selectedProduct.retail_price) }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Created</dt>
              <dd>{{ formatDate(selectedProduct.created_at) }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-neutral-500 dark:text-neutral-400">Description</dt>
              <dd>{{ selectedProduct.description || '—' }}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  </section>
</template>
